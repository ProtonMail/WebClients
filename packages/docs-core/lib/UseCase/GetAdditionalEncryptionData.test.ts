import {
  GetAssociatedEncryptionDataForRealtimeMessage,
  GetAssociatedEncryptionDataForComment,
  isAnonymousComment,
} from './GetAdditionalEncryptionData'

describe('GetAdditionalEncryptionData', () => {
  describe('GetAssociatedEncryptionDataForRealtimeMessage', () => {
    it('should format data with author address when present', () => {
      const metadata = {
        version: 1,
        authorAddress: 'test@example.com',
        timestamp: 1234567890,
      }

      const result = GetAssociatedEncryptionDataForRealtimeMessage(metadata)
      expect(result).toBe('1.test@example.com.1234567890')
    })

    it('should format data with "anonymous" when author address is undefined', () => {
      const metadata = {
        version: 1,
        authorAddress: undefined,
        timestamp: 1234567890,
      }

      const result = GetAssociatedEncryptionDataForRealtimeMessage(metadata)
      expect(result).toBe('1.anonymous.1234567890')
    })

    it('should handle different version numbers', () => {
      const metadata = {
        version: 2,
        authorAddress: 'test@example.com',
        timestamp: 1234567890,
      }

      const result = GetAssociatedEncryptionDataForRealtimeMessage(metadata)
      expect(result).toBe('2.test@example.com.1234567890')
    })
  })

  describe('GetAssociatedEncryptionDataForComment', () => {
    it('should format data with author address when present', () => {
      const metadata = {
        authorAddress: 'test@example.com',
        markId: 'mark-123',
      }

      const result = GetAssociatedEncryptionDataForComment(metadata)
      expect(result).toBe('test@example.com.mark-123')
    })

    it('should format data with "anonymous" when author address is undefined', () => {
      const metadata = {
        authorAddress: undefined,
        markId: 'mark-123',
      }

      const result = GetAssociatedEncryptionDataForComment(metadata)
      expect(result).toBe('anonymous.mark-123')
    })

    it('should handle different markId formats', () => {
      const metadata = {
        authorAddress: 'test@example.com',
        markId: 'uuid-123-456-789',
      }

      const result = GetAssociatedEncryptionDataForComment(metadata)
      expect(result).toBe('test@example.com.uuid-123-456-789')
    })
  })

  describe('isAnonymousComment', () => {
    it('should return true if the AAD is anonymous', () => {
      expect(isAnonymousComment('anonymous.mark-123')).toBe(true)
    })

    it('should return false if the AAD is not anonymous', () => {
      expect(isAnonymousComment('test@example.com.mark-123')).toBe(false)
    })
  })
})
