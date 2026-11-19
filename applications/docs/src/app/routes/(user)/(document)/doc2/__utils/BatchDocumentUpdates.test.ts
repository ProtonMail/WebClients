import type { HistoryEntry } from '@proton-docs/realtime-sdk'

import { BatchDocumentUpdates } from './BatchDocumentUpdates'

// Copied from packages/docs-core/lib/VersionHistory/BatchDocumentUpdates.spec.ts, over the SDK's History Log entries
function entries(length: number): HistoryEntry[] {
  return Array.from({ length }, (_, index) => ({
    uuid: `update-${index}`,
    origin: 'baseState',
    timestamp: 0,
    authorAddress: 'author@example.com',
    content: new Uint8Array(),
  }))
}

describe('BatchDocumentUpdates', () => {
  const batchDocumentUpdates = new BatchDocumentUpdates()

  it('should create batches of updates based on the threshold provided', () => {
    const twoHundredMessages = entries(200)

    const hundredThreshold = 100
    const hundredThresholdResult = batchDocumentUpdates.execute(twoHundredMessages, hundredThreshold)
    expect(hundredThresholdResult.isFailed()).toBeFalsy()
    expect(hundredThresholdResult.getValue().length).toBe(2)
    expect(hundredThresholdResult.getValue()[0].length).toBe(100)
    expect(hundredThresholdResult.getValue()[1].length).toBe(100)

    const fiftyThreshold = 50
    const fiftyThresholdResult = batchDocumentUpdates.execute(twoHundredMessages, fiftyThreshold)
    expect(fiftyThresholdResult.isFailed()).toBeFalsy()
    expect(fiftyThresholdResult.getValue().length).toBe(4)
    expect(fiftyThresholdResult.getValue()[0].length).toBe(50)
    expect(fiftyThresholdResult.getValue()[1].length).toBe(50)
    expect(fiftyThresholdResult.getValue()[2].length).toBe(50)
    expect(fiftyThresholdResult.getValue()[3].length).toBe(50)
  })

  it('should create batches even if number of messages is not perfectly divisible by threshold', () => {
    const twoTwentyFiveMessages = entries(225)

    const hundredThreshold = 100
    const hundredThresholdResult = batchDocumentUpdates.execute(twoTwentyFiveMessages, hundredThreshold)
    expect(hundredThresholdResult.isFailed()).toBeFalsy()
    expect(hundredThresholdResult.getValue().length).toBe(3)
    expect(hundredThresholdResult.getValue()[0].length).toBe(100)
    expect(hundredThresholdResult.getValue()[1].length).toBe(100)
    expect(hundredThresholdResult.getValue()[2].length).toBe(25)

    const twoHundredMessages = entries(200)

    const sixtyThreshold = 60
    const sixtyThresholdResult = batchDocumentUpdates.execute(twoHundredMessages, sixtyThreshold)
    expect(sixtyThresholdResult.isFailed()).toBeFalsy()
    expect(sixtyThresholdResult.getValue().length).toBe(4)
    expect(sixtyThresholdResult.getValue()[0].length).toBe(60)
    expect(sixtyThresholdResult.getValue()[1].length).toBe(60)
    expect(sixtyThresholdResult.getValue()[2].length).toBe(60)
    expect(sixtyThresholdResult.getValue()[3].length).toBe(20)
  })

  it('keeps the entries themselves, in their order', () => {
    const log = entries(3)

    expect(batchDocumentUpdates.execute(log, 2).getValue()).toEqual([[log[0], log[1]], [log[2]]])
  })

  it('makes no batch of an empty log', () => {
    expect(batchDocumentUpdates.execute([], 10).getValue()).toEqual([])
  })
})
