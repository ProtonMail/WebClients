import { MAX_DOC_SIZE, MAX_UPDATE_SIZE } from '../../Models/Constants'

export class DocSizeTracker {
  private currentSize = 0

  incrementSize(size: number) {
    this.currentSize += size
  }

  canPostUpdateOfSize(size: number) {
    return this.currentSize + size <= MAX_DOC_SIZE && size <= MAX_UPDATE_SIZE
  }

  resetWithSize(size: number) {
    this.currentSize = size
  }
}
