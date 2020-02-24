import renderVelocityTemplateObject from './renderVelocityTemplateObject'
import VelocityContext from './VelocityContext'

export default class LambdaIntegrationEvent {
  readonly #request: any
  readonly #requestTemplate: any
  readonly #stage: string

  constructor(request, stage: string, requestTemplate) {
    this.#request = request
    this.#requestTemplate = requestTemplate
    this.#stage = stage
  }

  create() {
    const velocityContext = new VelocityContext(
      this.#request,
      this.#stage,
      this.#request.payload || {},
    ).getContext()

    const event = renderVelocityTemplateObject(
      this.#requestTemplate,
      velocityContext,
    )

    return event
  }
}
