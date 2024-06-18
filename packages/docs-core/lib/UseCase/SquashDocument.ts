import {
  CommitVersion,
  CreateDocumentUpdate,
  DocumentUpdateVersion,
  SquashLock,
  CreateCommit,
  CreateSquashCommit,
  DocumentUpdate,
  SquashCommit,
} from '@proton/docs-proto'
import { UseCaseInterface } from '../Domain/UseCase/UseCaseInterface'
import { Result } from '../Domain/Result/Result'
import { DocsApi } from '../Api/Docs/DocsApi'
import { EncryptMessage } from './EncryptMessage'
import { DocumentKeys } from '@proton/drive-store'
import { DocumentMetaInterface } from '@proton/docs-shared'
import { GenerateManifestSignature } from './GenerateManifestSignature'
import { DecryptCommit } from './DecryptCommit'
import metrics from '@proton/metrics'
import { UpdatePair, SquashAlgorithm, SquashResult } from './SquashAlgorithm'
import { SQUASH_FACTOR, GetCommitDULimit } from '../Types/SquashingConstants'
import { VerifyCommit } from './VerifyCommit'
import { DecryptedCommit } from '../Models/DecryptedCommit'
import {
  SquashVerificationObjectionCallback,
  SquashVerificationObjectionDecision,
} from '../Types/SquashVerificationObjection'
import { GenerateUUID } from '../Util/GenerateUuid'

export type SquashDocumentDTO = {
  docMeta: DocumentMetaInterface
  commitId: string
  keys: DocumentKeys
  handleVerificationObjection: SquashVerificationObjectionCallback
}

/**
 * Squashes a document's series of updates into one or more resulting updates.
 */
export class SquashDocument implements UseCaseInterface<boolean> {
  constructor(
    private docsApi: DocsApi,
    private encryptMessage: EncryptMessage,
    private decryptCommit: DecryptCommit,
    private verifyCommit: VerifyCommit,
    private generateManifest: GenerateManifestSignature,
    private squashAlgoritm: SquashAlgorithm,
  ) {}

  async execute(dto: SquashDocumentDTO): Promise<Result<boolean>> {
    const { docMeta, commitId, keys } = dto

    const lockResult = await this.docsApi.lockDocument(docMeta, commitId)
    if (lockResult.isFailed()) {
      return Result.fail(lockResult.getError())
    }

    const squashLock = SquashLock.deserializeBinary(lockResult.getValue())

    const decryptionResult = await this.decryptCommit.execute({
      commit: squashLock.commit,
      keys: keys,
      commitId: squashLock.commitId,
    })
    if (decryptionResult.isFailed()) {
      metrics.docs_aborted_squashes_total.increment({ reason: 'decryption_error' })
      return Result.fail(decryptionResult.getError())
    }

    const decryptedCommit = decryptionResult.getValue()

    const verificationResult = await this.performVerification(decryptedCommit)

    if (verificationResult.isFailed()) {
      const objectionDecision = await dto.handleVerificationObjection()
      if (objectionDecision === SquashVerificationObjectionDecision.AbortSquash) {
        return Result.fail('Verification failed')
      }
    }

    const squashCommitResult = await this.squashTheCommit(docMeta, decryptedCommit, squashLock, keys)
    if (squashCommitResult.isFailed()) {
      return Result.fail(squashCommitResult.getError())
    }

    const squashCommit = squashCommitResult.getValue()

    const commitResult = await this.docsApi.squashCommit(docMeta, decryptedCommit.commitId, squashCommit)
    if (commitResult.isFailed()) {
      return Result.fail(commitResult.getError())
    }

    return Result.ok(true)
  }

  async squashTheCommit(
    document: DocumentMetaInterface,
    decryptedCommit: DecryptedCommit,
    squashLock: SquashLock,
    keys: DocumentKeys,
  ): Promise<Result<SquashCommit>> {
    const manifestResult = await this.generateManifest.execute(document, squashLock.commit)
    if (manifestResult.isFailed()) {
      return Result.fail(manifestResult.getError())
    }

    const { manifestSignature, signatureAddress, encSignature, contentHash } = manifestResult.getValue()

    const updatePairs: UpdatePair[] = decryptedCommit.updates.map((update, index) => ({
      encrypted: squashLock.commit.updates.documentUpdates[index],
      decrypted: update,
    }))

    const squashResult = await this.squashAlgoritm.execute(updatePairs, {
      limit: GetCommitDULimit(),
      factor: SQUASH_FACTOR,
    })
    if (squashResult.isFailed()) {
      return Result.fail(squashResult.getError())
    }

    const squashValue = squashResult.getValue()

    if (!squashValue.updatesAsSquashed) {
      return Result.fail('Squash failed; nothing to squash.')
    }

    const encryptedResult = await this.encryptSquashResult(squashValue, keys)
    if (encryptedResult.isFailed()) {
      metrics.docs_aborted_squashes_total.increment({ reason: 'encryption_error' })
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

    return Result.ok(squashCommit)
  }

  async performVerification(commit: DecryptedCommit): Promise<Result<true>> {
    const verificationResult = await this.verifyCommit.execute({
      commit,
    })

    if (verificationResult.isFailed()) {
      return Result.fail(verificationResult.getError())
    }

    const verificationValue = verificationResult.getValue()

    if (!verificationValue.allVerified) {
      return Result.fail('Verification failed')
    }

    return Result.ok(true)
  }

  async encryptSquashResult(squashResult: SquashResult, keys: DocumentKeys): Promise<Result<DocumentUpdate[]>> {
    const resultingUpdates: DocumentUpdate[] = []
    resultingUpdates.push(...squashResult.unmodifiedUpdates.map((update) => update.encrypted))

    if (squashResult.updatesAsSquashed) {
      const metadata = {
        version: DocumentUpdateVersion.V1,
        authorAddress: keys.userOwnAddress,
        timestamp: Date.now(),
      }

      const encryptedUpdate = await this.encryptMessage.execute(squashResult.updatesAsSquashed, metadata, keys)
      if (encryptedUpdate.isFailed()) {
        return Result.fail(encryptedUpdate.getError())
      }

      const update = CreateDocumentUpdate({
        content: encryptedUpdate.getValue(),
        authorAddress: metadata.authorAddress,
        timestamp: metadata.timestamp,
        version: metadata.version,
        uuid: GenerateUUID(),
      })

      resultingUpdates.push(update)
    }

    return Result.ok(resultingUpdates)
  }
}
