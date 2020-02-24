import { Server } from 'ws'
import debugLog from '../../debugLog'
import serverlessLog from '../../serverlessLog'
import { createUniqueId } from '../../utils/index'
import WebSocketClients from './WebSocketClients'
import { Options } from '../../types'

export default class WebSocketServer {
  readonly #options: Options
  readonly #server: Server
  readonly #webSocketClients: WebSocketClients

  constructor(
    options: Options,
    webSocketClients: WebSocketClients,
    sharedServer,
  ) {
    this.#options = options

    this.#server = new Server({
      server: sharedServer,
    })

    this.#webSocketClients = webSocketClients

    this.#server.on('connection', (webSocketClient, request) => {
      console.log('received connection')

      const connectionId = createUniqueId()

      debugLog(`connect:${connectionId}`)

      this.#webSocketClients.addClient(webSocketClient, request, connectionId)
    })
  }

  async start() {
    const { host, httpsProtocol, websocketPort } = this.#options

    serverlessLog(
      `Offline [websocket] listening on ws${
        httpsProtocol ? 's' : ''
      }://${host}:${websocketPort}`,
    )
  }

  // no-op, we're re-using the http server
  stop() {}

  addRoute(functionKey: string, webSocketEvent) {
    this.#webSocketClients.addRoute(functionKey, webSocketEvent.route)

    // serverlessLog(`route '${route}'`)
  }
}
