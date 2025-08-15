import type { DecryptedMessage } from '@proton/docs-shared'
import { GetCommitDULimit } from '../Types/SquashingConstants'
import { mergeUpdates } from 'yjs'
import { decompressDocumentUpdate, isCompressedDocumentUpdate } from '../utils/document-update-compression'

export class DecryptedCommit {
  public readonly byteSize: number

  constructor(
    public commitId: string,
    public messages: DecryptedMessage[],
  ) {
    this.byteSize = messages.reduce((acc, update) => acc + update.byteSize(), 0)

    Object.freeze(this)
  }

  numberOfMessages(): number {
    return this.messages.length
  }

  needsSquash(): boolean {
    return this.numberOfMessages() > GetCommitDULimit()
  }

  async squashedRepresentation(): Promise<Uint8Array<ArrayBuffer>> {
    try {
      const updates: Uint8Array<ArrayBuffer>[] = []
      for (const message of this.messages) {
        const content = message.content
        if (isCompressedDocumentUpdate(content)) {
          const decompressed = decompressDocumentUpdate(content)
          updates.push(decompressed)
        } else {
          updates.push(content)
        }
      }
      const merged = mergeUpdates(updates)
      return merged
    } catch (error) {
      throw new Error(`Failed to merge updates: ${error}`)
    }
  }
}
