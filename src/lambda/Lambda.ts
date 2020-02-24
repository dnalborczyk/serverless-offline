import Serverless, { FunctionDefinition } from 'serverless'
import HttpServer from './HttpServer'
import LambdaFunctionPool from './LambdaFunctionPool'
import { Options } from '../types'

export default class Lambda {
  readonly #lambdas: Map<string, FunctionDefinition> = new Map()
  readonly #lambdaFunctionNamesKeys: Map<string, string> = new Map()
  readonly #lambdaFunctionPool: LambdaFunctionPool
  readonly #httpServer: HttpServer

  constructor(serverless: Serverless, options: Options) {
    this.#httpServer = new HttpServer(options, this)
    this.#lambdaFunctionPool = new LambdaFunctionPool(serverless, options)
  }

  add(functionKey: string, functionDefinition: FunctionDefinition) {
    this.#lambdas.set(functionKey, functionDefinition)
    this.#lambdaFunctionNamesKeys.set(functionDefinition.name, functionKey)
  }

  get(functionKey: string) {
    const functionDefinition = this.#lambdas.get(functionKey)
    return this.#lambdaFunctionPool.get(functionKey, functionDefinition)
  }

  getByFunctionName(functionName: string) {
    const functionKey = this.#lambdaFunctionNamesKeys.get(functionName)
    return this.get(functionKey)
  }

  start() {
    return this.#httpServer.start()
  }

  // stops the server
  stop(timeout: number) {
    return this.#httpServer.stop(timeout)
  }

  cleanup() {
    return this.#lambdaFunctionPool.cleanup()
  }
}
