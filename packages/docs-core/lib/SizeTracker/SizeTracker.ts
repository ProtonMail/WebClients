import type { LoggerInterface } from '@proton/utils/logs'
import { MAX_DOC_SIZE, MAX_DOC_SIZE_THRESHOLD, MAX_UPDATE_SIZE } from '../Models/Constants'
import type { InternalEventBusInterface } from '@proton/docs-shared'

export const DocSizeTrackerEvent = 'DocSizeTrackerEvent'
export type DocSizeTrackerEventPayload = {
  exceededMaxSize: boolean
}

export class DocSizeTracker {
  private currentSize = 0
  hasReachedThreshold = false

  constructor(
    private readonly logger: LoggerInterface,
    private readonly eventBus: InternalEventBusInterface,
  ) {}

  private canIncrementSize(size: number) {
    return this.currentSize + size <= MAX_DOC_SIZE
  }

  incrementSize(size: number) {
    this.logger?.info(
      `Current size: ${this.currentSize}. Incrementing by ${size}. New total: ${this.currentSize + size}`,
    )
    this.currentSize += size
    if (this.currentSize >= MAX_DOC_SIZE_THRESHOLD) {
      this.hasReachedThreshold = true
    }
  }

  canPostUpdateOfSize(size: number) {
    if (this.currentSize >= MAX_DOC_SIZE_THRESHOLD && this.hasReachedThreshold) {
      if (this.currentSize >= MAX_DOC_SIZE) {
        this.eventBus.publish<DocSizeTrackerEventPayload>({
          type: DocSizeTrackerEvent,
          payload: {
            exceededMaxSize: true,
          },
        })
      } else {
        this.eventBus.publish<DocSizeTrackerEventPayload>({
          type: DocSizeTrackerEvent,
          payload: {
            exceededMaxSize: false,
          },
        })
      }
    }
    return this.canIncrementSize(size) && size <= MAX_UPDATE_SIZE
  }

  resetWithSize(size: number) {
    this.currentSize = size
  }
}
