import { DecryptedMessage } from '@proton/docs-shared'
import { DecryptedCommit } from './DecryptedCommit'

describe('DecryptedCommit', () => {
  it('should create an instance', () => {
    const decryptedCommit = new DecryptedCommit('commitId', [
      new DecryptedMessage({
        content: new Uint8Array([1, 2, 3]),
        signature: new Uint8Array([4, 5, 6]),
        authorAddress: 'authorAddress',
        aad: 'aad',
        timestamp: 123456,
      }),
    ])
    expect(decryptedCommit).toBeDefined()
  })

  it('should return byte size', () => {
    const decryptedCommit = new DecryptedCommit('commitId', [
      new DecryptedMessage({
        content: new Uint8Array([1, 2, 3]),
        signature: new Uint8Array([4, 5, 6]),
        authorAddress: 'authorAddress',
        aad: 'aad',
        timestamp: 123456,
      }),
    ])
    expect(decryptedCommit.byteSize).toBe(22)
  })

  it('should return number of updates', () => {
    const decryptedCommit = new DecryptedCommit('commitId', [
      new DecryptedMessage({
        content: new Uint8Array([1, 2, 3]),
        signature: new Uint8Array([4, 5, 6]),
        authorAddress: 'authorAddress',
        aad: 'aad',
        timestamp: 123456,
      }),
    ])
    expect(decryptedCommit.numberOfMessages()).toBe(1)
  })

  it('should return needs squash', () => {
    const decryptedCommit = new DecryptedCommit('commitId', [
      new DecryptedMessage({
        content: new Uint8Array([1, 2, 3]),
        signature: new Uint8Array([4, 5, 6]),
        authorAddress: 'authorAddress',
        aad: 'aad',
        timestamp: 123456,
      }),
    ])
    expect(decryptedCommit.needsSquash()).toBe(false)
  })
})
