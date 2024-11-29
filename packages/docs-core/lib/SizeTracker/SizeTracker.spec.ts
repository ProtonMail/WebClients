import { MAX_DOC_SIZE, MAX_UPDATE_SIZE } from '../Models/Constants'
import { DocSizeTracker } from './SizeTracker'

describe('SizeTracker', () => {
  it('should be able to post small update', () => {
    const tracker = new DocSizeTracker()

    expect(tracker.canPostUpdateOfSize(100)).toBe(true)
  })

  it('should not be able to post update larger than limit', () => {
    const tracker = new DocSizeTracker()

    expect(tracker.canPostUpdateOfSize(MAX_UPDATE_SIZE + 1)).toBe(false)
  })

  it('should not be able to post small update if would exceed threshold', () => {
    const tracker = new DocSizeTracker()

    tracker.incrementSize(MAX_DOC_SIZE - 1)

    expect(tracker.canPostUpdateOfSize(2)).toBe(false)
  })
})
