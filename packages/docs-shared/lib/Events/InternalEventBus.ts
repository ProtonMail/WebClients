import type { InternalEventBusInterface } from './InternalEventBusInterface'
import type { InternalEventHandlerInterface } from './InternalEventHandlerInterface'
import type { InternalEventInterface } from './InternalEventInterface'
import { InternalEventPublishStrategy } from './InternalEventPublishStrategy'
import type { InternalEventType } from './InternalEventType'

export class InternalEventBus implements InternalEventBusInterface {
  private eventHandlers: Map<InternalEventType, InternalEventHandlerInterface[]>

  constructor() {
    this.eventHandlers = new Map<InternalEventType, InternalEventHandlerInterface[]>()
  }

  deinit(): void {
    this.eventHandlers = new Map<InternalEventType, InternalEventHandlerInterface[]>()
  }

  addEventHandler(handler: InternalEventHandlerInterface, eventType: string): void {
    let handlersForEventType = this.eventHandlers.get(eventType)
    if (handlersForEventType === undefined) {
      handlersForEventType = []
    }

    handlersForEventType.push(handler)

    this.eventHandlers.set(eventType, handlersForEventType)
  }

  addEventCallback<Data = unknown>(callback: (data: Data) => void | Promise<void>, eventType: string): () => void {
    const handler: InternalEventHandlerInterface = {
      handleEvent: async (event: InternalEventInterface<Data>) => {
        await callback(event.payload)
      },
    }

    this.addEventHandler(handler, eventType)

    return () => {
      this.removeEventHandler(handler, eventType)
    }
  }

  removeEventHandler(handler: InternalEventHandlerInterface, eventType: string): void {
    const handlersForEventType = this.eventHandlers.get(eventType)
    if (handlersForEventType === undefined) {
      return
    }

    const index = handlersForEventType.indexOf(handler)
    if (index !== -1) {
      handlersForEventType.splice(index, 1)
    }
  }

  publish<Payload = unknown>(event: InternalEventInterface<Payload>): void {
    const handlersForEventType = this.eventHandlers.get(event.type)
    if (handlersForEventType === undefined) {
      return
    }

    for (const handlerForEventType of handlersForEventType) {
      void handlerForEventType.handleEvent(event)
    }
  }

  async publishSync(event: InternalEventInterface, strategy: InternalEventPublishStrategy): Promise<void> {
    const handlersForEventType = this.eventHandlers.get(event.type)
    if (handlersForEventType === undefined) {
      return
    }

    if (strategy === InternalEventPublishStrategy.SEQUENCE) {
      for (const handlerForEventType of handlersForEventType) {
        await handlerForEventType.handleEvent(event)
      }
    }

    if (strategy === InternalEventPublishStrategy.ASYNC) {
      const handlerPromises = []
      for (const handlerForEventType of handlersForEventType) {
        handlerPromises.push(handlerForEventType.handleEvent(event))
      }

      await Promise.all(handlerPromises)
    }
  }
}
