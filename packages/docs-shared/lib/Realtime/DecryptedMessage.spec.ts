import { DecryptedMessage } from './DecryptedMessage'

describe('DecryptedMessage', () => {
  it('should create an instance', () => {
    const decryptedMessage = new DecryptedMessage({
      content: new Uint8Array([1, 2, 3]),
      signature: new Uint8Array([4, 5, 6]),
      authorAddress: 'authorAddress',
      aad: 'aad',
      timestamp: 123456,
    })

    expect(decryptedMessage).toBeDefined()
  })

  it('should return byte size', () => {
    const decryptedMessage = new DecryptedMessage({
      content: new Uint8Array([1, 2, 3]),
      signature: new Uint8Array([4, 5, 6]),
      authorAddress: 'authorAddress',
      aad: 'aad',
      timestamp: 123456,
    })

    expect(decryptedMessage.byteSize()).toBe(22)
  })
})
