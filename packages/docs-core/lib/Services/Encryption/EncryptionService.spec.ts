import { CryptoProxy } from '@proton/crypto'
import { VERIFICATION_STATUS } from '@proton/crypto/lib/constants'
import { SignedPlaintextContent } from '@proton/docs-proto'
import { EncryptionService } from './EncryptionService'
import { HKDF_SALT_SIZE } from '../../Crypto/Constants'
import { deriveGcmKey } from '../../Crypto/deriveGcmKey'
import * as aesGcm from '@proton/crypto/lib/subtle/aesGcm'
import { EncryptionContext } from './EncryptionContext'
import { DriveCompatWrapper } from '@proton/drive-store/lib/DriveCompatWrapper'
import type { DriveCompat } from '@proton/drive-store/lib'

jest.mock('@proton/crypto', () => ({
  CryptoProxy: {
    signMessage: jest.fn(),
    verifyMessage: jest.fn(),
  },
}))

jest.mock('@proton/crypto/lib/subtle/aesGcm', () => ({
  encryptDataWith16ByteIV: jest.fn(),
  decryptData: jest.fn(),
}))

jest.mock('../../Crypto/deriveGcmKey', () => ({
  deriveGcmKey: jest.fn(),
}))

describe('EncryptionService', () => {
  const mockContext = EncryptionContext.RealtimeMessage
  const mockDriveCompat = new DriveCompatWrapper({
    userCompat: {
      getVerificationKey: jest.fn(),
    } as unknown as DriveCompat,
  })

  let service: EncryptionService<EncryptionContext.RealtimeMessage>

  beforeEach(() => {
    jest.clearAllMocks()
    service = new EncryptionService(mockContext, mockDriveCompat)
    ;(aesGcm.encryptDataWith16ByteIV as jest.Mock).mockResolvedValue(new Uint8Array([10, 11, 12]))
    ;(aesGcm.decryptData as jest.Mock).mockResolvedValue(new Uint8Array([13, 14, 15]))
  })

  describe('signAndEncryptData', () => {
    const mockData = new Uint8Array([1, 2, 3])
    const mockAssociatedData = 'test-data'
    const mockSessionKey = { key: 'test-key' } as any
    const mockSigningKey = { key: 'signing-key' } as any
    const mockSignature = new Uint8Array([4, 5, 6])
    const mockDerivedKey = { key: 'derived-key' } as any

    beforeEach(() => {
      ;(CryptoProxy.signMessage as jest.Mock).mockResolvedValue({ signature: mockSignature })
      ;(deriveGcmKey as jest.Mock).mockResolvedValue(mockDerivedKey)
      global.crypto.getRandomValues = jest.fn().mockReturnValue(new Uint8Array(HKDF_SALT_SIZE))
    })

    it('should successfully sign and encrypt data', async () => {
      const result = await service.signAndEncryptData(mockData, mockAssociatedData, mockSessionKey, mockSigningKey)

      expect(result.isFailed()).toBe(false)
      expect(() => result.getValue()).not.toThrow()
      expect(CryptoProxy.signMessage).toHaveBeenCalledWith({
        binaryData: mockData,
        signingKeys: mockSigningKey,
        signatureContext: { value: `docs.${mockContext}.${mockAssociatedData}`, critical: true },
        detached: true,
        format: 'binary',
      })
    })

    it('should handle errors gracefully', async () => {
      const error = new Error('Signing failed')
      ;(CryptoProxy.signMessage as jest.Mock).mockRejectedValue(error)

      const result = await service.signAndEncryptData(mockData, mockAssociatedData, mockSessionKey, mockSigningKey)

      expect(result.isFailed()).toBe(true)
      expect(result.getError()).toBe(`Failed to sign and encrypt data ${error}`)
      expect(() => result.getValue()).toThrow()
    })
  })

  describe('encryptAnonymousData', () => {
    const mockData = new Uint8Array([1, 2, 3])
    const mockAssociatedData = 'test-data'
    const mockSessionKey = { key: 'test-key' } as any
    const mockDerivedKey = { key: 'derived-key' } as any

    beforeEach(() => {
      ;(deriveGcmKey as jest.Mock).mockResolvedValue(mockDerivedKey)
      global.crypto.getRandomValues = jest.fn().mockReturnValue(new Uint8Array(HKDF_SALT_SIZE))
    })

    it('should successfully encrypt anonymous data', async () => {
      const result = await service.encryptAnonymousData(mockData, mockAssociatedData, mockSessionKey)

      expect(result.isFailed()).toBe(false)
      expect(() => result.getValue()).not.toThrow()
      expect(deriveGcmKey).toHaveBeenCalled()
    })

    it('should handle errors gracefully', async () => {
      const error = new Error('Encryption failed')
      ;(deriveGcmKey as jest.Mock).mockRejectedValue(error)

      const result = await service.encryptAnonymousData(mockData, mockAssociatedData, mockSessionKey)

      expect(result.isFailed()).toBe(true)
      expect(result.getError()).toBe(`Failed to sign and encrypt data ${error}`)
      expect(() => result.getValue()).toThrow()
    })
  })

  describe('decryptData', () => {
    const mockEncryptedData = new Uint8Array([1, 2, 3])
    const mockAssociatedData = 'test-data'
    const mockSessionKey = { key: 'test-key' } as any
    const mockDerivedKey = { key: 'derived-key' } as any
    const mockDecryptedData = new Uint8Array([4, 5, 6])

    beforeEach(() => {
      ;(deriveGcmKey as jest.Mock).mockResolvedValue(mockDerivedKey)
      SignedPlaintextContent.deserializeBinary = jest.fn().mockReturnValue({ content: mockDecryptedData })
    })

    it('should successfully decrypt data', async () => {
      const result = await service.decryptData(mockEncryptedData, mockAssociatedData, mockSessionKey)

      expect(result.isFailed()).toBe(false)
      expect(() => result.getValue()).not.toThrow()
      expect(deriveGcmKey).toHaveBeenCalled()
    })

    it('should handle errors gracefully', async () => {
      const error = new Error('Decryption failed')
      ;(deriveGcmKey as jest.Mock).mockRejectedValue(error)

      const result = await service.decryptData(mockEncryptedData, mockAssociatedData, mockSessionKey)

      expect(result.isFailed()).toBe(true)
      expect(result.getError()).toBe(`Failed to decrypt data ${error}`)
      expect(() => result.getValue()).toThrow()
    })
  })

  describe('verifyData', () => {
    const mockData = new Uint8Array([1, 2, 3])
    const mockSignature = new Uint8Array([4, 5, 6])
    const mockAssociatedData = 'test-data'
    const mockVerificationKeys = { key: 'verification-key' } as any

    beforeEach(() => {
      ;(CryptoProxy.verifyMessage as jest.Mock).mockResolvedValue({
        verificationStatus: VERIFICATION_STATUS.SIGNED_AND_VALID,
      })
    })

    it('should successfully verify data', async () => {
      const result = await service.verifyData(mockData, mockSignature, mockAssociatedData, mockVerificationKeys)

      expect(result.isFailed()).toBe(false)
      expect(result.getValue()).toBe(VERIFICATION_STATUS.SIGNED_AND_VALID)
      expect(CryptoProxy.verifyMessage).toHaveBeenCalledWith({
        binaryData: mockData,
        binarySignature: mockSignature,
        verificationKeys: mockVerificationKeys,
        signatureContext: { value: `docs.${mockContext}.${mockAssociatedData}`, required: true },
        format: 'binary',
      })
    })

    it('should handle errors gracefully', async () => {
      const error = new Error('Verification failed')
      ;(CryptoProxy.verifyMessage as jest.Mock).mockRejectedValue(error)

      const result = await service.verifyData(mockData, mockSignature, mockAssociatedData, mockVerificationKeys)

      expect(result.isFailed()).toBe(true)
      expect(result.getError()).toBe(`Failed to verify data ${error}`)
      expect(() => result.getValue()).toThrow()
    })
  })

  describe('getVerificationKey', () => {
    const mockEmail = 'test@example.com'
    const mockVerificationKey = ['test-key']

    it('should successfully get verification key', async () => {
      ;(mockDriveCompat.getUserCompat().getVerificationKey as jest.Mock).mockResolvedValue(mockVerificationKey)

      const result = await service.getVerificationKey(mockEmail)

      expect(result.isFailed()).toBe(false)
      expect(result.getValue()).toBe(mockVerificationKey)
      expect(mockDriveCompat.getUserCompat().getVerificationKey).toHaveBeenCalledWith(mockEmail)
    })

    it('should handle missing user compat', async () => {
      const serviceWithoutCompat = new EncryptionService(mockContext, new DriveCompatWrapper({ userCompat: undefined }))

      const result = await serviceWithoutCompat.getVerificationKey(mockEmail)

      expect(result.isFailed()).toBe(true)
      expect(result.getError()).toBe('Failed to get verification key Error: Public drive compat not found')
      expect(() => result.getValue()).toThrow()
    })

    it('should handle errors gracefully', async () => {
      const error = new Error('Get verification key failed')
      ;(mockDriveCompat.getUserCompat().getVerificationKey as jest.Mock).mockRejectedValue(error)

      const result = await service.getVerificationKey(mockEmail)

      expect(result.isFailed()).toBe(true)
      expect(result.getError()).toBe(`Failed to get verification key ${error}`)
      expect(() => result.getValue()).toThrow()
    })
  })
})
