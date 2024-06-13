import { DecryptedMessage } from '@proton/docs-shared'
import { BatchDocumentUpdates } from './BatchDocumentUpdates'

describe('BatchDocumentUpdates', () => {
  const batchDocumentUpdates = new BatchDocumentUpdates()

  it('should create batches of updates based on the threshold provided', () => {
    const twoHundredMessages = Array.from(
      { length: 200 },
      () =>
        ({
          content: new Uint8Array(),
        }) as DecryptedMessage,
    )

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
    const twoTwentyFiveMessages = Array.from(
      { length: 225 },
      () =>
        ({
          content: new Uint8Array(),
        }) as DecryptedMessage,
    )

    const hundredThreshold = 100
    const hundredThresholdResult = batchDocumentUpdates.execute(twoTwentyFiveMessages, hundredThreshold)
    expect(hundredThresholdResult.isFailed()).toBeFalsy()
    expect(hundredThresholdResult.getValue().length).toBe(3)
    expect(hundredThresholdResult.getValue()[0].length).toBe(100)
    expect(hundredThresholdResult.getValue()[1].length).toBe(100)
    expect(hundredThresholdResult.getValue()[2].length).toBe(25)

    const twoHundredMessages = Array.from(
      { length: 200 },
      () =>
        ({
          content: new Uint8Array(),
        }) as DecryptedMessage,
    )

    const sixtyThreshold = 60
    const sixtyThresholdResult = batchDocumentUpdates.execute(twoHundredMessages, sixtyThreshold)
    expect(sixtyThresholdResult.isFailed()).toBeFalsy()
    expect(sixtyThresholdResult.getValue().length).toBe(4)
    expect(sixtyThresholdResult.getValue()[0].length).toBe(60)
    expect(sixtyThresholdResult.getValue()[1].length).toBe(60)
    expect(sixtyThresholdResult.getValue()[2].length).toBe(60)
    expect(sixtyThresholdResult.getValue()[3].length).toBe(20)
  })
})
