import type { DecryptMessage } from './DecryptMessage'
import { type Commit } from '@proton/docs-proto'
import type { UseCaseInterface } from '../Domain/UseCase/UseCaseInterface'
import { Result } from '@proton/docs-shared'
import type { DecryptedMessage } from '@proton/docs-shared'
import { DecryptedCommit } from '../Models/DecryptedCommit'
import metrics from '@proton/metrics'
import type { DocumentKeys } from '@proton/drive-store/lib/_documents'
import { processMultipleDocumentUpdates } from '../utils/document-update-chunking'

type DecryptCommitDTO = {
  commit: Commit
  commitId: string
  documentContentKey: DocumentKeys['documentContentKey']
}

const VERIFY_VALUE_FALSE_DUE_TO_COMMIT_HAVING_SEPARATE_VERIFICATION = false

export class DecryptCommit implements UseCaseInterface<DecryptedCommit> {
  constructor(private decryptMessage: DecryptMessage) {}

  async execute(dto: DecryptCommitDTO): Promise<Result<DecryptedCommit>> {
    const updates = dto.commit.updates.documentUpdates

    const messages: DecryptedMessage[] = []
    const decryptedResults: Result<DecryptedMessage>[] = []

    const processedUpdates = await processMultipleDocumentUpdates(updates)
    for (const update of processedUpdates) {
      const result = await this.decryptMessage.execute({
        message: update,
        documentContentKey: dto.documentContentKey,
        verify: VERIFY_VALUE_FALSE_DUE_TO_COMMIT_HAVING_SEPARATE_VERIFICATION,
      })
      decryptedResults.push(result)
    }

    let lastFailedResult: Result<DecryptedMessage> | undefined

    for (const result of decryptedResults) {
      if (result.isFailed()) {
        metrics.docs_document_updates_decryption_error_total.increment({
          source: 'persistent',
        })
        lastFailedResult = result
        continue
      }
      messages.push(result.getValue())
    }

    if (lastFailedResult) {
      return Result.fail(lastFailedResult.getError())
    }

    const commit = new DecryptedCommit(dto.commitId, messages)

    return Result.ok(commit)
  }
}
