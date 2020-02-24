import debugLog from '../../debugLog'
import { logWarning } from '../../serverlessLog'
import {
  supportedNodejs,
  supportedPython,
  supportedRuby,
} from '../../config/index'
import { satisfiesVersionRange } from '../../utils/index'
import { Runner } from './interfaces'
import { Options } from '../../types'

export default class HandlerRunner {
  readonly #env: NodeJS.ProcessEnv
  readonly #funOptions: any
  readonly #options: Options
  #runner: Runner

  constructor(funOptions, options: Options, env: NodeJS.ProcessEnv) {
    this.#env = env
    this.#funOptions = funOptions
    this.#options = options
  }

  private async _loadRunner() {
    const { useChildProcesses, useWorkerThreads } = this.#options

    const {
      functionKey,
      handlerName,
      handlerPath,
      runtime,
      timeout,
    } = this.#funOptions

    debugLog(`Loading handler... (${handlerPath})`)

    if (supportedNodejs.has(runtime)) {
      if (useChildProcesses) {
        const { default: ChildProcessRunner } = await import(
          './ChildProcessRunner'
        )
        return new ChildProcessRunner(this.#funOptions, this.#env)
      }

      if (useWorkerThreads) {
        // worker threads
        this._verifyWorkerThreadCompatibility()

        const { default: WorkerThreadRunner } = await import(
          './WorkerThreadRunner'
        )
        return new WorkerThreadRunner(this.#funOptions, this.#env)
      }

      const { default: InProcessRunner } = await import('./InProcessRunner')
      return new InProcessRunner(
        functionKey,
        handlerPath,
        handlerName,
        this.#env,
        timeout,
      )
    }

    if (supportedPython.has(runtime)) {
      const { default: PythonRunner } = await import('./PythonRunner')
      return new PythonRunner(this.#funOptions, this.#env)
    }

    if (supportedRuby.has(runtime)) {
      const { default: RubyRunner } = await import('./RubyRunner')
      return new RubyRunner(this.#funOptions, this.#env)
    }

    // TODO FIXME
    throw new Error('Unsupported runtime')
  }

  private _verifyWorkerThreadCompatibility() {
    const currentVersion = process.versions.node
    const requiredVersionRange = '>=11.7.0'

    const versionIsSatisfied = satisfiesVersionRange(
      currentVersion,
      requiredVersionRange,
    )

    // we're happy
    if (!versionIsSatisfied) {
      logWarning(
        `"worker threads" require node.js version ${requiredVersionRange}, but found version ${currentVersion}.
         To use this feature you have to update node.js to a later version.
        `,
      )

      throw new Error(
        '"worker threads" are not supported with this node.js version',
      )
    }
  }

  cleanup() {
    // TODO console.log('handler runner cleanup')
    return this.#runner.cleanup()
  }

  async run(event, context) {
    if (this.#runner == null) {
      this.#runner = await this._loadRunner()
    }

    return this.#runner.run(event, context)
  }
}
