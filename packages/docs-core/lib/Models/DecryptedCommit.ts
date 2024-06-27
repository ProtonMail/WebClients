import { DecryptedMessage } from '@proton/docs-shared'
import { GetCommitDULimit } from '../Types/SquashingConstants'
import { mergeUpdates } from 'yjs'

export class DecryptedCommit {
  public readonly byteSize: number

  constructor(
    public commitId: string,
    public updates: DecryptedMessage[],
  ) {
    this.byteSize = updates.reduce((acc, update) => acc + update.byteSize(), 0)

    Object.freeze(this)
  }

  numberOfUpdates(): number {
    return this.updates.length
  }

  needsSquash(): boolean {
    return this.numberOfUpdates() > GetCommitDULimit()
  }

  squashedRepresentation(): Uint8Array {
    try {
      const merged = mergeUpdates(this.updates.map((update) => update.content))
      return merged
    } catch (error) {
      throw new Error(`Failed to merge updates: ${error}`)
    }
  }
}
