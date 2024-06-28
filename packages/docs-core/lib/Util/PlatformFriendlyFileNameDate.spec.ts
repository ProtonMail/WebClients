import { getPlatformFriendlyDateForFileName } from './PlatformFriendlyFileNameDate'

describe('PlatformFriendlyFileNameDate', () => {
  it('should return a date string with a platform friendly format', () => {
    const result = getPlatformFriendlyDateForFileName()

    expect(result).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}\.\d{2}\.\d{2}$/)
  })
})
