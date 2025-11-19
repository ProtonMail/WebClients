import type { LoggerInterface } from '@proton/utils/logs'
import { MAX_DOC_SIZE, MAX_UPDATE_SIZE } from '../Models/Constants'

export class DocSizeTracker {
  private currentSize = 0

  constructor(private readonly logger?: LoggerInterface) {}

  private canIncrementSize(size: number) {
    return this.currentSize + size <= MAX_DOC_SIZE
  }

  incrementSize(size: number) {
    this.logger?.info(`Incrementing document size by ${size}. New total: ${this.currentSize + size}`)
    this.currentSize += size
  }

  canPostUpdateOfSize(size: number) {
    return this.canIncrementSize(size) && size <= MAX_UPDATE_SIZE
  }

  resetWithSize(size: number) {
    this.currentSize = size
  }
}
