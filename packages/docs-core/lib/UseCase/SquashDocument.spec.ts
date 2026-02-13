import type { InternalEventBusInterface } from '@proton/docs-shared'
import { ApiResult, Result } from '@proton/docs-shared'
import type { DocsApi } from '../Api/DocsApi'
import type { DecryptCommit } from './DecryptCommit'
import type { EncryptMessage } from './EncryptMessage'
import type { SquashAlgorithm } from './SquashAlgorithm'
import type { SquashDocumentDTO } from './SquashDocument'
import { SquashDocument } from './SquashDocument'
import type { VerifyCommit } from './VerifyCommit'
import { SquashVerificationObjectionDecision } from '../Types/SquashVerificationObjection'
import type { LoggerInterface } from '@proton/utils/logs'
import type UnleashClient from '@proton/unleash/UnleashClient'
import type { CacheService } from '../Services/CacheService'

jest.mock('@proton/docs-proto', () => ({
  ...jest.requireActual('@proton/docs-proto'),
  SquashLock: {
    deserializeBinary: jest.fn().mockReturnValue({
      commit: {
        updates: {
          documentUpdates: [{}],
        },
      },
      commitId: 'commitId',
    }),
  },
}))

describe('SquashDocument', () => {
  let usecase: SquashDocument
  let docsApi: DocsApi
  let decryptCommit: DecryptCommit
  let verifyCommit: VerifyCommit
  let squashAlgorithm: SquashAlgorithm
  let encryptMessage: EncryptMessage
  let logger: LoggerInterface
  let unleashClient: UnleashClient
  let cacheService: CacheService
  let eventBus: InternalEventBusInterface

  const dto: SquashDocumentDTO = {
    nodeMeta: {} as any,
    commitId: 'commitId',
    keys: {} as any,
    handleVerificationObjection: jest.fn(),
    documentType: 'doc',
  }

  beforeEach(() => {
    docsApi = {
      lockDocument: jest.fn().mockReturnValue(Result.ok({})),
      squashCommit: jest.fn().mockReturnValue(Result.ok({})),
    } as unknown as DocsApi

    decryptCommit = {
      execute: jest.fn().mockReturnValue(
        Result.ok({
          messages: [],
        }),
      ),
    } as unknown as DecryptCommit

    verifyCommit = {
      execute: jest.fn().mockReturnValue(Result.ok(true)),
    } as unknown as VerifyCommit

    encryptMessage = {
      execute: jest.fn().mockReturnValue(Result.ok({})),
    } as unknown as EncryptMessage

    squashAlgorithm = {
      squashNormal: jest.fn().mockReturnValue(
        Result.ok({
          updatesAsSquashed: new Uint8Array(),
          unmodifiedUpdates: [],
        }),
      ),
    } as unknown as SquashAlgorithm

    logger = {
      info: jest.fn(),
      error: jest.fn(),
    } as unknown as LoggerInterface

    unleashClient = {
      isReady: jest.fn().mockReturnValue(true),
      isEnabled: jest.fn().mockImplementation((feature: string) => {
        if (feature === 'DocsClientSquashingEnabled') {
          return true
        }
        if (feature === 'DocsClientSquashingDisabled') {
          return false
        }
      }),
    } as unknown as UnleashClient

    cacheService = {
      removeCachedCommit: jest.fn().mockResolvedValue(Result.ok()),
    } as unknown as CacheService

    eventBus = {
      publish: jest.fn(),
    } as unknown as InternalEventBusInterface

    usecase = new SquashDocument(
      docsApi,
      encryptMessage,
      decryptCommit,
      verifyCommit,
      squashAlgorithm,
      logger,
      unleashClient,
      cacheService,
      eventBus,
    )
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('should lock document before doing anything else', async () => {
    const lockDocumentSpy = jest.spyOn(docsApi, 'lockDocument')

    decryptCommit.execute = jest.fn().mockResolvedValue(Result.fail('failed'))
    const decryptCommitSpy = jest.spyOn(decryptCommit, 'execute')

    await usecase.execute(dto)

    expect(lockDocumentSpy).toHaveBeenCalled()
    expect(decryptCommitSpy).toHaveBeenCalled()

    expect(lockDocumentSpy.mock.invocationCallOrder[0]).toBeLessThan(decryptCommitSpy.mock.invocationCallOrder[0])
  })

  it('should fail if lock document fails', async () => {
    docsApi.lockDocument = jest.fn().mockReturnValue(ApiResult.fail({ message: 'failed', code: 0 }))

    const result = await usecase.execute(dto)

    expect(result.isFailed()).toBe(true)
  })

  it('should verify signature of data', async () => {
    const verifyCommitSpy = jest.spyOn(verifyCommit, 'execute')

    await usecase.execute(dto)

    expect(verifyCommitSpy).toHaveBeenCalled()
  })

  it('should issue objection is verification fails', async () => {
    const verificationResult = Result.fail('failed')
    verifyCommit.execute = jest.fn().mockReturnValue(verificationResult)
    const verifyCommitSpy = jest.spyOn(verifyCommit, 'execute')

    dto.handleVerificationObjection = jest.fn().mockReturnValue(SquashVerificationObjectionDecision.AbortSquash)

    await usecase.execute(dto)

    expect(verifyCommitSpy).toHaveBeenCalled()
    expect(dto.handleVerificationObjection).toHaveBeenCalled()
  })

  it('should abort squash if verification object decision is to abort', async () => {
    const verificationResult = Result.fail('failed')
    verifyCommit.execute = jest.fn().mockReturnValue(verificationResult)

    dto.handleVerificationObjection = jest.fn().mockReturnValue(SquashVerificationObjectionDecision.AbortSquash)

    const squashTheCommitSpy = jest.spyOn(usecase, 'squashTheCommit')

    const result = await usecase.execute(dto)

    expect(result.isFailed()).toBe(true)
    expect(squashTheCommitSpy).not.toHaveBeenCalled()
  })

  it('should continue squash if verification object decision is to continue', async () => {
    const verificationResult = Result.fail('failed')
    verifyCommit.execute = jest.fn().mockReturnValue(verificationResult)

    dto.handleVerificationObjection = jest.fn().mockReturnValue(SquashVerificationObjectionDecision.ContinueSquash)

    const squashTheCommitSpy = jest.spyOn(usecase, 'squashTheCommit')

    await usecase.execute(dto)

    expect(squashTheCommitSpy).toHaveBeenCalled()
  })

  it.only('should upload the squashed commit', async () => {
    const commitResult = Result.ok({})
    docsApi.squashCommit = jest.fn().mockReturnValue(commitResult)

    await usecase.execute(dto)

    expect(docsApi.squashCommit).toHaveBeenCalled()
  })

  describe('squashTheCommit', () => {
    it('should encrypt the result', async () => {
      decryptCommit.execute = jest.fn().mockResolvedValue(Result.ok({ messages: [{}] }))

      const encryptSpy = jest.spyOn(usecase, 'encryptSquashResult')

      await usecase.execute(dto)

      expect(encryptSpy).toHaveBeenCalled()
    })
  })
})
