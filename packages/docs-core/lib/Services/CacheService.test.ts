import { CacheService } from './CacheService'

describe('document localID cache', () => {
  const document = { volumeId: 'volume-id', linkId: 'link-id' }

  beforeEach(() => {
    localStorage.clear()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('reports when the localID is durable', () => {
    expect(CacheService.setLocalIDForDocumentInCache(document, 4)).toBe(true)
    expect(CacheService.getLocalIDForDocumentFromCache(document)).toBe(4)
  })

  it('reports when the localID cannot be persisted', () => {
    vi.spyOn(localStorage, 'setItem').mockImplementation(() => {
      throw new Error('Storage unavailable')
    })

    expect(CacheService.setLocalIDForDocumentInCache(document, 4)).toBe(false)
  })
})
