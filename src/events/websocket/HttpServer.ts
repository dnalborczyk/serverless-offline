import { Server } from '@hapi/hapi'
import { catchAllRoute, connectionsRoutes } from './http-routes/index'
import WebSocketClients from './WebSocketClients'
import serverlessLog from '../../serverlessLog'
import { Options } from '../../types'

export default class HttpServer {
  readonly #options: Options
  readonly #server: Server
  readonly #webSocketClients: WebSocketClients

  constructor(options: Options, webSocketClients: WebSocketClients) {
    this.#options = options
    this.#webSocketClients = webSocketClients

    const { host, websocketPort } = options

    const serverOptions = {
      host,
      port: websocketPort,
      router: {
        // allows for paths with trailing slashes to be the same as without
        // e.g. : /my-path is the same as /my-path/
        stripTrailingSlash: true,
      },
    }

    this.#server = new Server(serverOptions)
  }

  async start() {
    // add routes
    const routes = [
      ...connectionsRoutes(this.#webSocketClients),
      catchAllRoute(),
    ]
    this.#server.route(routes)

    const { host, httpsProtocol, websocketPort } = this.#options

    try {
      await this.#server.start()
    } catch (err) {
      console.error(
        `Unexpected error while starting serverless-offline websocket server on port ${websocketPort}:`,
        err,
      )
      process.exit(1)
    }

    serverlessLog(
      `Offline [http for websocket] listening on http${
        httpsProtocol ? 's' : ''
      }://${host}:${websocketPort}`,
    )
  }

  // stops the server
  stop(timeout: number) {
    return this.#server.stop({
      timeout,
    })
  }

  get server() {
    return this.#server.listener
  }
}
