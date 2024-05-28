import { Result, UseCaseInterface } from '@standardnotes/domain-core'
import { DocumentUpdate } from '@proton/docs-proto'
import { DecryptedMessage } from '../Models/DecryptedMessage'
import { mergeUpdates } from 'yjs'

export type UpdatePair = {
  encrypted: DocumentUpdate
  decrypted: DecryptedMessage
}

export type SquashResult = {
  untamperedUpdates: UpdatePair[]
  squashedUpdates?: Uint8Array
}

export class SquashAlgorithm implements UseCaseInterface<SquashResult> {
  async execute(updates: UpdatePair[], config: { threshold: number; factor: number }): Promise<Result<SquashResult>> {
    const desiredNumberOfUpdates = config.threshold * config.factor

    const numUpdatesToSquash = updates.length - desiredNumberOfUpdates

    if (numUpdatesToSquash <= 0) {
      return Result.ok({
        squashedUpdates: undefined,
        untamperedUpdates: updates,
      })
    }

    const updatesToSquash = updates.slice(-numUpdatesToSquash)
    const untamperedUpdates = updates.slice(0, updates.length - numUpdatesToSquash)

    const squashedUpdates = mergeUpdates(updatesToSquash.map((update) => update.decrypted.content))

    return Result.ok({
      squashedUpdates: squashedUpdates,
      untamperedUpdates: untamperedUpdates,
    })
  }
}
