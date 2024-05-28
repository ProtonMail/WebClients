import {
  CommitVersion,
  CreateDocumentUpdate,
  DocumentUpdateVersion,
  SquashLock,
  CreateCommit,
  CreateSquashCommit,
  DocumentUpdate,
} from '@proton/docs-proto'
import { Result, UseCaseInterface } from '@standardnotes/domain-core'
import { DocsApi } from '../Api/Docs/DocsApi'
import { EncryptMessage } from './EncryptMessage'
import { DocumentKeys } from '@proton/drive-store'
import { DocumentMetaInterface } from '@proton/docs-shared'
import { GenerateManifestSignature } from './GenerateManifestSignature'
import { DecryptCommit } from './DecryptCommit'
import { UpdatePair, SquashAlgorithm } from './SquashAlgorithm'
import { SQUASH_FACTOR, SQUASH_THRESHOLD } from '../Types/SquashingConstants'

/**
 * Squashes a document's series of updates into one or more resulting updates.
 */
export class SquashDocument implements UseCaseInterface<boolean> {
  constructor(
    private docsApi: DocsApi,
    private encryptMessage: EncryptMessage,
    private decryptCommit: DecryptCommit,
    private generateManifest: GenerateManifestSignature,
    private squashAlgoritm: SquashAlgorithm,
  ) {}

  async execute(docMeta: DocumentMetaInterface, commitId: string, keys: DocumentKeys): Promise<Result<boolean>> {
    const lockResult = await this.docsApi.lockDocument(docMeta, commitId)
    if (lockResult.isFailed()) {
      return Result.fail(lockResult.getError())
    }

    const squashLock = SquashLock.deserializeBinary(lockResult.getValue())

    const manifestResult = await this.generateManifest.execute(docMeta, squashLock.commit)

    if (manifestResult.isFailed()) {
      return Result.fail(manifestResult.getError())
    }

    const { manifestSignature, signatureAddress, encSignature, contentHash } = manifestResult.getValue()

    const decryptionResult = await this.decryptCommit.execute({
      commit: squashLock.commit,
      keys: keys,
      commitId: squashLock.commitId,
      verificationMode: 'immediate',
    })

    if (decryptionResult.isFailed()) {
      return Result.fail(decryptionResult.getError())
    }

    const decryptedCommit = decryptionResult.getValue()

    const updatePairs: UpdatePair[] = decryptedCommit.updates.map((update, index) => ({
      encrypted: squashLock.commit.updates.documentUpdates[index],
      decrypted: update,
    }))

    const squashResult = await this.squashAlgoritm.execute(updatePairs, {
      threshold: SQUASH_THRESHOLD,
      factor: SQUASH_FACTOR,
    })
    if (squashResult.isFailed()) {
      return Result.fail(squashResult.getError())
    }

    const metadata = {
      version: DocumentUpdateVersion.V1,
      authorAddress: keys.userOwnAddress,
    }

    const squashValue = squashResult.getValue()

    if (!squashValue.squashedUpdates) {
      return Result.fail('Squash failed; nothing to squash.')
    }

    const encryptedResult = await this.encryptSquashResult(
      squashValue.untamperedUpdates,
      squashValue.squashedUpdates,
      metadata,
      keys,
    )
    if (encryptedResult.isFailed()) {
      return Result.fail(encryptedResult.getError())
    }

    const commit = CreateCommit({
      updates: encryptedResult.getValue(),
      version: CommitVersion.V1,
      lockId: squashLock.lockId,
    })

    const squashCommit = CreateSquashCommit({
      lockId: squashLock.lockId,
      commitId: squashLock.commitId,
      commit,
      manifestSignature,
      signatureAddress,
      encSignature,
      contentHash,
    })

    const commitResult = await this.docsApi.squashCommit(docMeta, decryptedCommit.commitId, squashCommit)
    if (commitResult.isFailed()) {
      return Result.fail(commitResult.getError())
    }

    return Result.ok(true)
  }

  private async encryptSquashResult(
    untamperedUpdates: UpdatePair[],
    squashedUpdates: Uint8Array,
    metadata: { version: number; authorAddress: string },
    keys: DocumentKeys,
  ): Promise<Result<DocumentUpdate[]>> {
    const result: DocumentUpdate[] = [...untamperedUpdates.map((update) => update.encrypted)]

    const timestamp = Date.now()
    const encryptedUpdate = await this.encryptMessage.execute(squashedUpdates, { ...metadata, timestamp }, keys)
    if (encryptedUpdate.isFailed()) {
      return Result.fail(encryptedUpdate.getError())
    }

    const update = CreateDocumentUpdate({
      content: encryptedUpdate.getValue(),
      authorAddress: metadata.authorAddress,
      timestamp: timestamp,
      version: metadata.version,
    })

    result.push(update)

    return Result.ok(result)
  }
}
