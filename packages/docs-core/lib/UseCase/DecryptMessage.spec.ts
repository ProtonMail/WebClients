import type { Mock, Mocked } from 'vitest'
import { Result } from '@proton/docs-shared/Result'
import type { EncryptionService } from '../Services/Encryption/EncryptionService'
import type { EncryptionContext } from '../Services/Encryption/EncryptionContext'
import type { DecryptMessageDTO } from './DecryptMessage'
import { DecryptMessage } from './DecryptMessage'
import type { DocumentUpdate } from '@proton/docs-proto/Generated/DocumentUpdate'
import type { SessionKey } from '@protontech/crypto'

describe('DecryptMessage', () => {
  let decryptMessage: DecryptMessage
  let encryptionSerivce: EncryptionService<EncryptionContext.RealtimeMessage>

  const key = '' as unknown as SessionKey

  beforeEach(() => {
    encryptionSerivce = {
      decryptData: vi.fn().mockReturnValue(Result.ok({ content: new Uint8Array(), signature: new Uint8Array() })),
      getVerificationKey: vi.fn().mockReturnValue(Result.ok(new Uint8Array())),
      verifyData: vi.fn().mockReturnValue(Result.ok(2)),
    } as unknown as Mocked<EncryptionService<EncryptionContext.RealtimeMessage>>
    decryptMessage = new DecryptMessage(encryptionSerivce)
  })

  it('should decrypt data', async () => {
    const dto: DecryptMessageDTO = {
      message: {
        content: new Uint8Array(),
        authorAddress: 'string',
        timestamp: 0,
        version: 0,
      } as unknown as Mocked<DocumentUpdate>,
      documentContentKey: key,
      verify: true,
    }
    await decryptMessage.execute(dto)

    expect(encryptionSerivce.decryptData).toHaveBeenCalled()
  })

  it('should fetch verification key', async () => {
    const dto: DecryptMessageDTO = {
      message: {
        content: new Uint8Array(),
        authorAddress: 'string',
        timestamp: 0,
        version: 0,
      } as unknown as Mocked<DocumentUpdate>,
      documentContentKey: key,
      verify: true,
    }
    await decryptMessage.execute(dto)

    expect(encryptionSerivce.getVerificationKey).toHaveBeenCalled()
  })

  it('should fail if cannot fetch verification key', async () => {
    ;(encryptionSerivce.getVerificationKey as Mock).mockReturnValue(Result.fail('error'))

    const dto: DecryptMessageDTO = {
      message: {
        content: new Uint8Array(),
        authorAddress: 'string',
        timestamp: 0,
        version: 0,
      } as unknown as Mocked<DocumentUpdate>,
      documentContentKey: key,
      verify: true,
    }

    const result = await decryptMessage.execute(dto)

    expect(result.isFailed()).toBeTruthy()
  })

  it('should verify data', async () => {
    const dto: DecryptMessageDTO = {
      message: {
        content: new Uint8Array(),
        authorAddress: 'string',
        timestamp: 0,
        version: 0,
      } as unknown as Mocked<DocumentUpdate>,
      documentContentKey: key,
      verify: true,
    }
    await decryptMessage.execute(dto)

    expect(encryptionSerivce.verifyData).toHaveBeenCalled()
  })

  it('should fail if verification fails', async () => {
    ;(encryptionSerivce.verifyData as Mock).mockReturnValue(Result.fail('error'))

    const dto: DecryptMessageDTO = {
      message: {
        content: new Uint8Array(),
        authorAddress: 'string',
        timestamp: 0,
        version: 0,
      } as unknown as Mocked<DocumentUpdate>,
      documentContentKey: key,
      verify: true,
    }

    const result = await decryptMessage.execute(dto)

    expect(result.isFailed()).toBeTruthy()
  })

  it('should not verify if verify is false', async () => {
    const dto: DecryptMessageDTO = {
      message: {
        content: new Uint8Array(),
        authorAddress: 'string',
        timestamp: 0,
        version: 0,
      } as unknown as Mocked<DocumentUpdate>,
      documentContentKey: key,
      verify: false,
    }

    await decryptMessage.execute(dto)

    expect(encryptionSerivce.verifyData).not.toHaveBeenCalled()
  })
})
