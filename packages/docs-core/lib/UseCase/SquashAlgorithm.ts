import type { UseCaseInterface } from '../Domain/UseCase/UseCaseInterface'
import { Result } from '../Domain/Result/Result'
import type { DocumentUpdate } from '@proton/docs-proto'
import type { DecryptedMessage } from '@proton/docs-shared'
import { mergeUpdates } from 'yjs'
import type { LoggerInterface } from '@proton/utils/logs'

export type UpdatePair = {
  encrypted: DocumentUpdate
  decrypted: DecryptedMessage
}

export type SquashResult = {
  unmodifiedUpdates: UpdatePair[]
  updatesAsSquashed: Uint8Array | undefined
}

export class SquashAlgorithm implements UseCaseInterface<SquashResult> {
  constructor(private logger: LoggerInterface) {}

  async execute(updates: UpdatePair[], config: { limit: number; factor: number }): Promise<Result<SquashResult>> {
    this.logger.info(
      `[Squash] Executing squash algorithm with ${updates.length} updates and config ${JSON.stringify(config)}`,
    )

    const desiredNumberOfUpdates = Math.floor(config.limit * config.factor)

    const numUpdatesToSquash = updates.length - desiredNumberOfUpdates

    if (numUpdatesToSquash <= 0) {
      this.logger.info(`[Squash] No updates to squash, returning original updates`)

      return Result.ok({
        updatesAsSquashed: undefined,
        unmodifiedUpdates: updates,
      })
    }

    this.logger.info(`[Squash] Squashing ${numUpdatesToSquash} updates`)

    const updatesToSquash = updates.slice(-numUpdatesToSquash)
    const unmodifiedUpdates = updates.slice(0, updates.length - numUpdatesToSquash)

    const updatesAsSquashed = mergeUpdates(updatesToSquash.map((update) => update.decrypted.content))

    this.logger.info(`[Squash] Squashed ${updatesToSquash.length} updates`)

    return Result.ok({
      updatesAsSquashed,
      unmodifiedUpdates,
    })
  }
}
