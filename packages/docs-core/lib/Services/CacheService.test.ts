import { CacheService } from './CacheService'

jest.mock('@proton/drive-store/lib', () => ({
  nodeMetaUniqueId: jest.fn(),
}))

describe('document localID cache', () => {
  const document = { volumeId: 'volume-id', linkId: 'link-id' }

  beforeEach(() => {
    localStorage.clear()
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('reports when the localID is durable', () => {
    expect(CacheService.setLocalIDForDocumentInCache(document, 4)).toBe(true)
    expect(CacheService.getLocalIDForDocumentFromCache(document)).toBe(4)
  })

  it('reports when the localID cannot be persisted', () => {
    jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('Storage unavailable')
    })

    expect(CacheService.setLocalIDForDocumentInCache(document, 4)).toBe(false)
  })
})
