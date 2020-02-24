import Serverless from 'serverless'
import WebSocket, { OPEN } from 'ws'
import {
  WebSocketConnectEvent,
  WebSocketDisconnectEvent,
  WebSocketEvent,
} from './lambda-events/index'
import debugLog from '../../debugLog'
import serverlessLog from '../../serverlessLog'
import {
  DEFAULT_WEBSOCKETS_API_ROUTE_SELECTION_EXPRESSION,
  DEFAULT_WEBSOCKETS_ROUTE,
} from '../../config/index'
import { jsonPath } from '../../utils/index'
import { Options } from '../../types'
import Lambda from '../../lambda/index'

const { parse, stringify } = JSON

export default class WebSocketClients {
  readonly #clients: Map<string, WebSocket> &
    Map<WebSocket, string> = new Map()
  readonly #lambda: Lambda
  readonly #options: Options
  readonly #webSocketRoutes: Map<string, any> = new Map()
  readonly #websocketsApiRouteSelectionExpression: string

  constructor(serverless: Serverless, options: Options, lambda: Lambda) {
    this.#lambda = lambda
    this.#options = options
    this.#websocketsApiRouteSelectionExpression =
      // @ts-ignore
      serverless.service.provider.websocketsApiRouteSelectionExpression ||
      DEFAULT_WEBSOCKETS_API_ROUTE_SELECTION_EXPRESSION
  }

  private _addWebSocketClient(
    webSocketClient: WebSocket,
    connectionId: string,
  ) {
    this.#clients.set(webSocketClient, connectionId)
    this.#clients.set(connectionId, webSocketClient)
  }

  private _removeWebSocketClient(webSocketClient: WebSocket) {
    const connectionId = this.#clients.get(webSocketClient)

    this.#clients.delete(webSocketClient)
    this.#clients.delete(connectionId)

    return connectionId
  }

  private _getWebSocketClient(connectionId: string) {
    return this.#clients.get(connectionId)
  }

  private async _processEvent(
    webSocketClient: WebSocket,
    connectionId: string,
    route: string,
    event,
  ) {
    let functionKey = this.#webSocketRoutes.get(route)

    if (!functionKey && route !== '$connect' && route !== '$disconnect') {
      functionKey = this.#webSocketRoutes.get('$default')
    }

    if (!functionKey) {
      return
    }

    const sendError = (err) => {
      if (webSocketClient.readyState === OPEN) {
        webSocketClient.send(
          stringify({
            connectionId,
            message: 'Internal server error',
            requestId: '1234567890',
          }),
        )
      }

      // mimic AWS behaviour (close connection) when the $connect route handler throws
      if (route === '$connect') {
        webSocketClient.close()
      }

      debugLog(`Error in route handler '${functionKey}'`, err)
    }

    const lambdaFunction = this.#lambda.get(functionKey)

    lambdaFunction.setEvent(event)

    // let result

    try {
      /* result = */ await lambdaFunction.runHandler()

      // TODO what to do with "result"?
    } catch (err) {
      console.log(err)
      sendError(err)
    }
  }

  private _getRoute(value: string) {
    let json

    try {
      json = parse(value)
    } catch (err) {
      return DEFAULT_WEBSOCKETS_ROUTE
    }

    const routeSelectionExpression = this.#websocketsApiRouteSelectionExpression.replace(
      'request.body',
      '',
    )

    const route = jsonPath(json, routeSelectionExpression)

    if (typeof route !== 'string') {
      return DEFAULT_WEBSOCKETS_ROUTE
    }

    return route || DEFAULT_WEBSOCKETS_ROUTE
  }

  addClient(webSocketClient: WebSocket, request, connectionId: string) {
    this._addWebSocketClient(webSocketClient, connectionId)

    const connectEvent = new WebSocketConnectEvent(
      connectionId,
      request,
      this.#options,
    ).create()

    this._processEvent(webSocketClient, connectionId, '$connect', connectEvent)

    webSocketClient.on('close', () => {
      debugLog(`disconnect:${connectionId}`)

      this._removeWebSocketClient(webSocketClient)

      const disconnectEvent = new WebSocketDisconnectEvent(
        connectionId,
      ).create()

      this._processEvent(
        webSocketClient,
        connectionId,
        '$disconnect',
        disconnectEvent,
      )
    })

    webSocketClient.on('message', (message: string) => {
      debugLog(`message:${message}`)

      const route = this._getRoute(message)

      debugLog(`route:${route} on connection=${connectionId}`)

      const event = new WebSocketEvent(connectionId, route, message).create()

      this._processEvent(webSocketClient, connectionId, route, event)
    })
  }

  addRoute(functionKey: string, route: string) {
    // set the route name
    this.#webSocketRoutes.set(route, functionKey)

    serverlessLog(`route '${route}'`)
  }

  close(connectionId: string) {
    const client = this._getWebSocketClient(connectionId)

    if (client) {
      client.close()
      return true
    }

    return false
  }

  send(connectionId: string, payload) {
    const client = this._getWebSocketClient(connectionId)

    if (client) {
      client.send(payload)
      return true
    }

    return false
  }
}
