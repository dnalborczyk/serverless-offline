import Serverless from 'serverless'
import HttpServer from './HttpServer'
import WebSocketEventDefinition from './WebSocketEventDefinition'
import WebSocketClients from './WebSocketClients'
import WebSocketServer from './WebSocketServer'
import { Options } from '../../types'
import Lambda from '../../lambda/index'

export default class WebSocket {
  readonly #httpServer: HttpServer
  readonly #webSocketServer: WebSocketServer

  constructor(serverless: Serverless, options: Options, lambda: Lambda) {
    const webSocketClients = new WebSocketClients(serverless, options, lambda)

    this.#httpServer = new HttpServer(options, webSocketClients)

    // share server
    this.#webSocketServer = new WebSocketServer(
      options,
      webSocketClients,
      this.#httpServer.server,
    )
  }

  start() {
    return Promise.all([
      this.#httpServer.start(),
      this.#webSocketServer.start(),
    ])
  }

  // stops the server
  stop(timeout: number) {
    return Promise.all([
      this.#httpServer.stop(timeout),
      this.#webSocketServer.stop(),
    ])
  }

  createEvent(functionKey: string, rawWebSocketEventDefinition) {
    const webSocketEvent = new WebSocketEventDefinition(
      rawWebSocketEventDefinition,
    )

    this.#webSocketServer.addRoute(functionKey, webSocketEvent)
  }
}
