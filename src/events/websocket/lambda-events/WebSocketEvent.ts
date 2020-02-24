import WebSocketRequestContext from './WebSocketRequestContext'

export default class WebSocketEvent {
  readonly #connectionId: string
  readonly #payload: any
  readonly #route: string

  constructor(connectionId: string, route: string, payload) {
    this.#connectionId = connectionId
    this.#payload = payload
    this.#route = route
  }

  create() {
    const requestContext = new WebSocketRequestContext(
      'MESSAGE',
      this.#route,
      this.#connectionId,
    ).create()

    return {
      body: this.#payload,
      isBase64Encoded: false,
      requestContext,
    }
  }
}
