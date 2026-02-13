import type { DocumentUpdate, SquashCommit } from '@proton/docs-proto'
import {
  CommitVersion,
  CreateDocumentUpdate,
  DocumentUpdateVersion,
  SquashLock,
  CreateCommit,
  CreateSquashCommit,
} from '@proton/docs-proto'
import type { UseCaseInterface } from '../Domain/UseCase/UseCaseInterface'
import type { InternalEventBusInterface } from '@proton/docs-shared'
import { Result, GenerateUUID } from '@proton/docs-shared'
import type { DocsApi } from '../Api/DocsApi'
import type { EncryptMessage } from './EncryptMessage'
import type { DocumentKeys, NodeMeta } from '@proton/drive-store'
import type { DecryptCommit } from './DecryptCommit'
import metrics from '@proton/metrics'
import type { UpdatePair, SquashAlgorithm, SquashResult } from './SquashAlgorithm'
import { SQUASH_FACTOR, GetCommitDULimit } from '../Types/SquashingConstants'
import type { VerifyCommit } from './VerifyCommit'
import type { DecryptedCommit } from '../Models/DecryptedCommit'
import type { SquashVerificationObjectionCallback } from '../Types/SquashVerificationObjection'
import { SquashVerificationObjectionDecision } from '../Types/SquashVerificationObjection'
import { metricsBucketNumberForUpdateCount } from '../Util/bucketNumberForUpdateCount'
import type { LoggerInterface } from '@proton/utils/logs'
import type UnleashClient from '@proton/unleash/UnleashClient'
import type { DocumentType } from '@proton/drive-store/store/_documents'
import { compressDocumentUpdate, isDocumentUpdateCompressionEnabled } from '../utils/document-update-compression'
import type { CacheService } from '../Services/CacheService'
import { seconds_to_ms } from '../Util/time-utils'

export type SquashDocumentDTO = {
  documentType: DocumentType
  nodeMeta: NodeMeta
  commitId: string
  keys: DocumentKeys
  handleVerificationObjection: SquashVerificationObjectionCallback
}

const MaxRetryAttempts = 5
const MaxRetryBackoffInMilliseconds = seconds_to_ms(32)

export const SquashErrorEvent = 'SquashErrorEvent'

/**
 * Squashes a document's series of updates into one or more resulting updates.
 */
export class SquashDocument implements UseCaseInterface<boolean> {
  private attemptsToSquash = 0
  private retryTimeout: ReturnType<typeof setTimeout> | undefined = undefined

  constructor(
    private docsApi: DocsApi,
    private encryptMessage: EncryptMessage,
    private decryptCommit: DecryptCommit,
    private verifyCommit: VerifyCommit,
    private squashAlgoritm: SquashAlgorithm,
    private logger: LoggerInterface,
    private unleashClient: UnleashClient,
    private cacheService: CacheService,
    // @ts-expect-error - eventBus is temporarily not used
    private eventBus: InternalEventBusInterface,
  ) {}

  isSquashingEnabled(documentType: DocumentType) {
    if (!this.unleashClient.isReady()) {
      return false
    }
    if (documentType === 'doc') {
      return (
        this.unleashClient.isEnabled('DocsClientSquashingEnabled') &&
        !this.unleashClient.isEnabled('DocsClientSquashingDisabled')
      )
    }
    if (documentType === 'sheet') {
      return (
        this.unleashClient.isEnabled('SheetsClientSquashingEnabled') &&
        !this.unleashClient.isEnabled('SheetsClientSquashingDisabled')
      )
    }
    return false
  }

  async execute(dto: SquashDocumentDTO): Promise<Result<boolean>> {
    if (!this.isSquashingEnabled(dto.documentType)) {
      return Result.fail('Squashing is not enabled for this document type')
    }

    const startTime = Date.now()

    const { nodeMeta, commitId, keys } = dto

    this.logger.info('[Squash] Locking document...')

    this.attemptsToSquash++
    clearTimeout(this.retryTimeout)

    let lockID: string | undefined = undefined

    try {
      const lockResult = await this.docsApi.lockDocument(nodeMeta, commitId)
      if (lockResult.isFailed()) {
        metrics.docs_aborted_squashes_total.increment({ reason: 'network_error' })
        throw new Error(lockResult.getErrorMessage())
      }

      const squashLock = SquashLock.deserializeBinary(lockResult.getValue())

      lockID = squashLock.lockId

      this.logger.info('[Squash] Decrypting commit...')

      const decryptionResult = await this.decryptCommit.execute({
        commit: squashLock.commit,
        documentContentKey: keys.documentContentKey,
        commitId: squashLock.commitId,
      })
      if (decryptionResult.isFailed()) {
        metrics.docs_aborted_squashes_total.increment({ reason: 'decryption_error' })
        throw new Error(decryptionResult.getError())
      }

      const decryptedCommit = decryptionResult.getValue()

      const verificationResult = await this.performVerification(decryptedCommit)

      if (verificationResult.isFailed()) {
        const objectionDecision = await dto.handleVerificationObjection()
        if (objectionDecision === SquashVerificationObjectionDecision.AbortSquash) {
          metrics.docs_aborted_squashes_total.increment({ reason: 'unknown' })
          throw new Error('Verification failed')
        }
      }

      const squashCommitResult = await this.squashTheCommit(decryptedCommit, squashLock, keys, dto.documentType)
      if (squashCommitResult.isFailed()) {
        throw new Error(squashCommitResult.getError())
      }

      const squashCommit = squashCommitResult.getValue()
      if (squashCommit === undefined) {
        // nothing to squash which means the commit is already squashed but we've loaded
        // a cached version, which we can remove.
        this.logger.info('[Squash] No updates to squash, removing commit from cache...')
        this.attemptsToSquash = 0
        void this.removeCommitFromCache(decryptedCommit.commitId)
        return Result.ok(true)
      }

      this.logger.info('[Squash] Sending squash commit to API...')

      const commitResult = await this.docsApi.squashCommit(nodeMeta, decryptedCommit.commitId, squashCommit)
      if (commitResult.isFailed()) {
        metrics.docs_aborted_squashes_total.increment({ reason: 'network_error' })
        throw new Error(commitResult.getErrorMessage())
      }

      const endTime = Date.now()
      const timeToSquashInSeconds = Math.floor((endTime - startTime) / 1000)

      this.logger.info(`[Squash] Took ${timeToSquashInSeconds} seconds to complete successfully`)

      metrics.docs_squashes_latency_histogram.observe({
        Labels: {
          updates: metricsBucketNumberForUpdateCount(decryptedCommit.messages.length),
        },
        Value: timeToSquashInSeconds,
      })

      metrics.docs_squashes_total.increment({})

      void this.removeCommitFromCache(squashLock.commitId)
    } catch (error) {
      this.logger.error(`[Squash] Failed to squash document: ${error}`)
      if (lockID) {
        this.logger.info(`[Squash] Unlocking document with lock ID ${lockID}...`)
        await this.docsApi.unlockDocument(nodeMeta, lockID).catch((error) => {
          this.logger.error(`[Squash] Failed to unlock document ${nodeMeta.linkId}: ${error}`)
        })
      }
      if (this.attemptsToSquash >= MaxRetryAttempts) {
        this.logger.error(`[Squash] Failed to squash document after ${MaxRetryAttempts} attempts`)
        // this.eventBus.publish({
        //   type: SquashErrorEvent,
        //   payload: undefined,
        // })
        return Result.fail(`Failed to squash document after ${MaxRetryAttempts} attempts`)
      } else {
        const delay = Math.min(Math.pow(2, this.attemptsToSquash) * 1000, MaxRetryBackoffInMilliseconds)
        this.logger.info(`[Squash] Retrying squash document in ${delay} milliseconds...`)
        this.retryTimeout = setTimeout(() => {
          void this.execute(dto)
        }, delay)
      }
      return Result.fail(`Failed to squash document`)
    }

    this.attemptsToSquash = 0

    return Result.ok(true)
  }

  async removeCommitFromCache(commitId: string): Promise<void> {
    void this.cacheService
      .removeCachedCommit(commitId)
      .then(() => {
        this.logger.info(`[Squash] Removed cached commit ${commitId} after successful squash`)
      })
      .catch((error) => {
        this.logger.error(`[Squash] Failed to remove cached commit ${commitId}: ${error}`)
      })
  }

  async squashTheCommit(
    decryptedCommit: DecryptedCommit,
    squashLock: SquashLock,
    keys: DocumentKeys,
    documentType: DocumentType,
  ): Promise<Result<SquashCommit | undefined>> {
    const updatePairs: UpdatePair[] = decryptedCommit.messages.map((update, index) => ({
      encrypted: squashLock.commit.updates.documentUpdates[index],
      decrypted: update,
    }))

    this.logger.info('[Squash] Executing squash algorithm...')

    const squashResult = await this.squashAlgoritm.squashNormal(updatePairs, {
      limit: GetCommitDULimit(documentType),
      factor: SQUASH_FACTOR,
    })
    if (squashResult.isFailed()) {
      metrics.docs_aborted_squashes_total.increment({ reason: 'unknown' })
      return Result.fail(squashResult.getError())
    }

    const squashValue = squashResult.getValue()

    if (!squashValue.updatesAsSquashed) {
      return Result.ok(undefined)
    }

    const squashCommitResult = await this.createSquashCommitFromSquashResult(
      squashValue,
      squashLock,
      keys,
      documentType,
    )
    if (squashCommitResult.isFailed()) {
      return Result.fail(squashCommitResult.getError())
    }

    return Result.ok(squashCommitResult.getValue())
  }

  async createSquashCommitFromSquashResult(
    squashResult: SquashResult,
    squashLock: SquashLock,
    keys: DocumentKeys,
    documentType: DocumentType,
  ): Promise<Result<SquashCommit>> {
    this.logger.info('[Squash] Encrypting squash result...')

    const encryptedResult = await this.encryptSquashResult(squashResult, keys, documentType)
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
    })

    return Result.ok(squashCommit)
  }

  async performVerification(commit: DecryptedCommit): Promise<Result<true>> {
    this.logger.info('[Squash] Verifying commit...')

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

  async encryptSquashResult(
    squashResult: SquashResult,
    keys: DocumentKeys,
    documentType: DocumentType,
  ): Promise<Result<DocumentUpdate[]>> {
    const resultingUpdates: DocumentUpdate[] = []
    resultingUpdates.push(...squashResult.unmodifiedUpdates.map((update) => update.encrypted))

    if (squashResult.updatesAsSquashed) {
      let squashedContent = squashResult.updatesAsSquashed
      if (isDocumentUpdateCompressionEnabled(this.unleashClient, documentType)) {
        const sizeBeforeCompression = squashedContent.byteLength
        squashedContent = compressDocumentUpdate(squashedContent)
        this.logger.info(
          `[Squash] Compressed squash result from ${sizeBeforeCompression} bytes to ${squashedContent.byteLength} bytes`,
        )
      }

      const metadata = {
        version: DocumentUpdateVersion.V1,
        authorAddress: keys.userOwnAddress,
        timestamp: Date.now(),
      }

      const encryptedUpdate = await this.encryptMessage.execute(squashedContent, metadata, keys)
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

  async squashEverythingInBaseCommit(dto: SquashDocumentDTO): Promise<Result<boolean>> {
    const { nodeMeta, commitId, keys, documentType } = dto

    if (!this.isSquashingEnabled(documentType)) {
      return Result.fail('Squashing is not enabled for this document type')
    }

    this.logger.info(`[Squash] Squashing everything in base commit...`)

    try {
      const lockResult = await this.docsApi.lockDocument(nodeMeta, commitId)
      if (lockResult.isFailed()) {
        this.logger.error(`[Squash] Failed to lock document: ${lockResult.getErrorMessage()}`)
        throw new Error(lockResult.getErrorMessage())
      }

      const squashLock = SquashLock.deserializeBinary(lockResult.getValue())

      this.logger.info('[Squash] Decrypting commit...')

      const decryptionResult = await this.decryptCommit.execute({
        commit: squashLock.commit,
        documentContentKey: keys.documentContentKey,
        commitId: squashLock.commitId,
      })
      if (decryptionResult.isFailed()) {
        throw new Error(decryptionResult.getError())
      }
      const decryptedCommit = decryptionResult.getValue()

      const updatePairs: UpdatePair[] = decryptedCommit.messages.map((update, index) => ({
        encrypted: squashLock.commit.updates.documentUpdates[index],
        decrypted: update,
      }))

      const squashResult = this.squashAlgoritm.squashEverything(updatePairs).getValue()

      const squashCommitResult = await this.createSquashCommitFromSquashResult(
        squashResult,
        squashLock,
        keys,
        documentType,
      )
      if (squashCommitResult.isFailed()) {
        return Result.fail(squashCommitResult.getError())
      }
      const squashCommit = squashCommitResult.getValue()

      const commitResult = await this.docsApi.squashCommit(nodeMeta, decryptedCommit.commitId, squashCommit)
      if (commitResult.isFailed()) {
        throw new Error(commitResult.getErrorMessage())
      }

      void this.removeCommitFromCache(squashLock.commitId)

      return Result.ok(true)
    } catch (error) {
      return Result.fail(`Failed to squash everything in base commit`)
    }
  }
}
