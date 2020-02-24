import Serverless from 'serverless'
import HttpEventDefinition from './HttpEventDefinition'
import HttpServer from './HttpServer'
import { Options } from '../../types'
import Lambda from '../../lambda/index'

export default class Http {
  readonly #httpServer: HttpServer

  constructor(serverless: Serverless, options: Options, lambda: Lambda) {
    this.#httpServer = new HttpServer(serverless, options, lambda)
  }

  start() {
    return this.#httpServer.start()
  }

  // stops the server
  stop(timeout: number) {
    return this.#httpServer.stop(timeout)
  }

  createEvent(functionKey: string, rawHttpEventDefinition, handler: string) {
    const httpEvent = new HttpEventDefinition(rawHttpEventDefinition)

    this.#httpServer.createRoutes(functionKey, httpEvent, handler)
  }

  createResourceRoutes() {
    this.#httpServer.createResourceRoutes()
  }

  create404Route() {
    this.#httpServer.create404Route()
  }

  registerPlugins() {
    return this.#httpServer.registerPlugins()
  }

  // TEMP FIXME quick fix to expose gateway server for testing, look for better solution
  getServer() {
    return this.#httpServer.getServer()
  }
}
