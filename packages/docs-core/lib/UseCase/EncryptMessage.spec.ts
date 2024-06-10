import { Result } from '@standardnotes/domain-core'
import { EncryptionService } from '../Services/Encryption/EncryptionService'
import { EncryptionContext } from '../Services/Encryption/EncryptionContext'
import { DocumentKeys } from '@proton/drive-store'
import { EncryptMessage } from './EncryptMessage'
import { GetAssociatedEncryptionDataForRealtimeMessage } from './GetAdditionalEncryptionData'

jest.mock('../Services/Encryption/EncryptionService')
jest.mock('./GetAdditionalEncryptionData')

describe('EncryptMessage', () => {
  let encryptMessage: EncryptMessage
  let encryptionService: jest.Mocked<EncryptionService<EncryptionContext.RealtimeMessage>>

  const update = new Uint8Array()
  const metadata = { version: 1, authorAddress: 'author@example.com', timestamp: 1234567890 }
  const keys = {} as DocumentKeys

  beforeEach(() => {
    encryptionService = {
      signAndEncryptData: jest.fn().mockResolvedValue(Result.ok(new Uint8Array())),
      decryptData: jest.fn().mockResolvedValue(Result.ok(new Uint8Array())),
    } as unknown as jest.Mocked<EncryptionService<EncryptionContext.RealtimeMessage>>

    encryptMessage = new EncryptMessage(encryptionService)
  })

  it('should call signAndEncryptData with correct parameters', async () => {
    const associatedData = new Uint8Array([1, 2, 3])
    ;(GetAssociatedEncryptionDataForRealtimeMessage as jest.Mock).mockReturnValue(associatedData)
    encryptionService.signAndEncryptData.mockResolvedValue(Result.ok(new Uint8Array([4, 5, 6])))

    await encryptMessage.execute(update, metadata, keys)

    expect(GetAssociatedEncryptionDataForRealtimeMessage).toHaveBeenCalledWith(metadata)
    expect(encryptionService.signAndEncryptData).toHaveBeenCalledWith(
      update,
      associatedData,
      keys.documentContentKey,
      keys.userAddressPrivateKey,
    )
  })

  it('should return encrypted data on success', async () => {
    const encryptedData = new Uint8Array([4, 5, 6])
    encryptionService.signAndEncryptData = jest.fn().mockResolvedValue(Result.ok(encryptedData))

    const result = await encryptMessage.execute(update, metadata, keys)

    expect(result.isFailed()).toBe(false)
    expect(result.getValue()).toEqual(encryptedData)
  })

  it('should fail if signAndEncryptData fails', async () => {
    encryptionService.signAndEncryptData.mockResolvedValue(Result.fail('error'))

    const result = await encryptMessage.execute(update, metadata, keys)

    expect(result.isFailed()).toBe(true)
    expect(result.getError()).toBe('error')
  })
})
