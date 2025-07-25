import { MAX_DOC_SIZE, MAX_UPDATE_SIZE } from '../Models/Constants'

export class DocSizeTracker {
  private currentSize = 0

  private canIncrementSize(size: number) {
    return this.currentSize + size <= MAX_DOC_SIZE
  }

  incrementSize(size: number) {
    this.currentSize += size
  }

  canPostUpdateOfSize(size: number) {
    return this.canIncrementSize(size) && size <= MAX_UPDATE_SIZE
  }

  resetWithSize(size: number) {
    this.currentSize = size
  }
}
