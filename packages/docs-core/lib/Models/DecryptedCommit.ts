import { DecryptedMessage } from '@proton/docs-shared'
import { GetCommitDULimit } from '../Types/SquashingConstants'
import { mergeUpdates } from 'yjs'

export class DecryptedCommit {
  constructor(
    public commitId: string,
    public updates: DecryptedMessage[],
  ) {}

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
