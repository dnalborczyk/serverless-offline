import { Server } from '@hapi/hapi'
import { invokeRoute } from './routes/index'
import serverlessLog from '../serverlessLog'
import { Options } from '../types'
import Lambda from '../lambda/index'

export default class HttpServer {
  readonly #lambda: Lambda
  readonly #options: Options
  readonly #server: Server

  constructor(options: Options, lambda: Lambda) {
    this.#lambda = lambda
    this.#options = options

    const { host, lambdaPort } = options

    const serverOptions = {
      host,
      port: lambdaPort,
    }

    this.#server = new Server(serverOptions)
  }

  async start() {
    // add routes
    const route = invokeRoute(this.#lambda)
    this.#server.route(route)

    const { host, httpsProtocol, lambdaPort } = this.#options

    try {
      await this.#server.start()
    } catch (err) {
      console.error(
        `Unexpected error while starting serverless-offline lambda server on port ${lambdaPort}:`,
        err,
      )
      process.exit(1)
    }

    serverlessLog(
      `Offline [http for lambda] listening on http${
        httpsProtocol ? 's' : ''
      }://${host}:${lambdaPort}`,
    )
  }

  // stops the server
  stop(timeout: number) {
    return this.#server.stop({
      timeout,
    })
  }
}
