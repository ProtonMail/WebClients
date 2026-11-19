import type { InternalEventBusInterface } from '@proton/docs-shared/Events/InternalEventBusInterface'
import { ApiResult } from '@proton/docs-shared/ApiResult'
import { Result } from '@proton/docs-shared/Result'
import type { DocsApi } from '../Api/DocsApi'
import type { DecryptCommit } from './DecryptCommit'
import type { EncryptMessage } from './EncryptMessage'
import type { SquashAlgorithm } from './SquashAlgorithm'
import type { SquashDocumentDTO } from './SquashDocument'
import { SquashDocument } from './SquashDocument'
import type { VerifyCommit } from './VerifyCommit'
import { SquashVerificationObjectionDecision } from '../Types/SquashVerificationObjection'
import type { LoggerInterface } from '@proton/shared/lib/logs'
import type { UnleashClient } from '@proton/unleash/UnleashClient'
import type { CacheService } from '../Services/CacheService'

vi.mock('@proton/docs-proto/Generated/Squash', async () => ({
  ...(await vi.importActual('@proton/docs-proto/Generated/Squash')),
  SquashLock: {
    deserializeBinary: vi.fn().mockReturnValue({
      commit: {
        updates: {
          documentUpdates: [{}],
        },
      },
      commitId: 'commitId',
    }),
  },
}))

// isDevOrBlack reads window.location.host, there is no DOM on node
vi.stubGlobal('window', { location: { host: '' } })

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
    handleVerificationObjection: vi.fn(),
    documentType: 'doc',
  }

  beforeEach(() => {
    docsApi = {
      lockDocument: vi.fn().mockReturnValue(Result.ok({})),
      squashCommit: vi.fn().mockReturnValue(Result.ok({})),
    } as unknown as DocsApi

    decryptCommit = {
      execute: vi.fn().mockReturnValue(
        Result.ok({
          messages: [],
        }),
      ),
    } as unknown as DecryptCommit

    verifyCommit = {
      execute: vi.fn().mockReturnValue(Result.ok(true)),
    } as unknown as VerifyCommit

    encryptMessage = {
      execute: vi.fn().mockReturnValue(Result.ok({})),
    } as unknown as EncryptMessage

    squashAlgorithm = {
      squashNormal: vi.fn().mockReturnValue(
        Result.ok({
          updatesAsSquashed: new Uint8Array(),
          unmodifiedUpdates: [],
        }),
      ),
    } as unknown as SquashAlgorithm

    logger = {
      info: vi.fn(),
      error: vi.fn(),
    } as unknown as LoggerInterface

    unleashClient = {
      isReady: vi.fn().mockReturnValue(true),
      isEnabled: vi.fn().mockImplementation((feature: string) => {
        if (feature === 'DocsClientSquashingEnabled') {
          return true
        }
        if (feature === 'DocsClientSquashingDisabled') {
          return false
        }
      }),
    } as unknown as UnleashClient

    cacheService = {
      removeCachedCommit: vi.fn().mockResolvedValue(Result.ok()),
    } as unknown as CacheService

    eventBus = {
      publish: vi.fn(),
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
    vi.clearAllMocks()
  })

  it('should lock document before doing anything else', async () => {
    const lockDocumentSpy = vi.spyOn(docsApi, 'lockDocument')

    decryptCommit.execute = vi.fn().mockResolvedValue(Result.fail('failed'))
    const decryptCommitSpy = vi.spyOn(decryptCommit, 'execute')

    await usecase.execute(dto)

    expect(lockDocumentSpy).toHaveBeenCalled()
    expect(decryptCommitSpy).toHaveBeenCalled()

    expect(lockDocumentSpy.mock.invocationCallOrder[0]).toBeLessThan(decryptCommitSpy.mock.invocationCallOrder[0])
  })

  it('should fail if lock document fails', async () => {
    docsApi.lockDocument = vi.fn().mockReturnValue(ApiResult.fail({ message: 'failed', code: 0 }))

    const result = await usecase.execute(dto)

    expect(result.isFailed()).toBe(true)
  })

  it('should verify signature of data', async () => {
    const verifyCommitSpy = vi.spyOn(verifyCommit, 'execute')

    await usecase.execute(dto)

    expect(verifyCommitSpy).toHaveBeenCalled()
  })

  it('should issue objection is verification fails', async () => {
    const verificationResult = Result.fail('failed')
    verifyCommit.execute = vi.fn().mockReturnValue(verificationResult)
    const verifyCommitSpy = vi.spyOn(verifyCommit, 'execute')

    dto.handleVerificationObjection = vi.fn().mockReturnValue(SquashVerificationObjectionDecision.AbortSquash)

    await usecase.execute(dto)

    expect(verifyCommitSpy).toHaveBeenCalled()
    expect(dto.handleVerificationObjection).toHaveBeenCalled()
  })

  it('should abort squash if verification object decision is to abort', async () => {
    const verificationResult = Result.fail('failed')
    verifyCommit.execute = vi.fn().mockReturnValue(verificationResult)

    dto.handleVerificationObjection = vi.fn().mockReturnValue(SquashVerificationObjectionDecision.AbortSquash)

    const squashTheCommitSpy = vi.spyOn(usecase, 'squashTheCommit')

    const result = await usecase.execute(dto)

    expect(result.isFailed()).toBe(true)
    expect(squashTheCommitSpy).not.toHaveBeenCalled()
  })

  it('should continue squash if verification object decision is to continue', async () => {
    const verificationResult = Result.fail('failed')
    verifyCommit.execute = vi.fn().mockReturnValue(verificationResult)

    dto.handleVerificationObjection = vi.fn().mockReturnValue(SquashVerificationObjectionDecision.ContinueSquash)

    const squashTheCommitSpy = vi.spyOn(usecase, 'squashTheCommit')

    await usecase.execute(dto)

    expect(squashTheCommitSpy).toHaveBeenCalled()
  })

  it('should upload the squashed commit', async () => {
    const commitResult = Result.ok({})
    docsApi.squashCommit = vi.fn().mockReturnValue(commitResult)

    await usecase.execute(dto)

    expect(docsApi.squashCommit).toHaveBeenCalled()
  })

  describe('squashTheCommit', () => {
    it('should encrypt the result', async () => {
      decryptCommit.execute = vi.fn().mockResolvedValue(Result.ok({ messages: [{}] }))

      const encryptSpy = vi.spyOn(usecase, 'encryptSquashResult')

      await usecase.execute(dto)

      expect(encryptSpy).toHaveBeenCalled()
    })
  })
})
