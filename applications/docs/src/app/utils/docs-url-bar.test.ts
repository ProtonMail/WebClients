import { parseOpenAction, replaceLastPathSegment } from './docs-url-bar'

describe('parseOpenAction', () => {
  const createSearchParams = (params: Record<string, string>) => {
    return new URLSearchParams(params)
  }

  const docPathname = '/doc'

  describe('invalid routes', () => {
    it('returns "new" mode for empty params', () => {
      expect(parseOpenAction(createSearchParams({}), docPathname)).toEqual({
        mode: 'new',
        type: 'doc',
      })
    })

    it('returns null for empty params with invalid path', () => {
      expect(parseOpenAction(createSearchParams({}), '')).toBeNull()
    })

    it('returns null for incomplete params', () => {
      expect(parseOpenAction(createSearchParams({ mode: 'open' }), docPathname)).toBeNull()
    })
  })

  describe('public link scenarios', () => {
    it('handles open-url mode with public link', () => {
      const params = createSearchParams({
        token: 'test-token',
        linkId: 'test-link',
        action: 'edit',
      })

      Object.defineProperty(window, 'location', {
        value: { hash: '#password123' },
      })

      expect(parseOpenAction(params, docPathname)).toEqual({
        type: 'doc',
        mode: 'open-url',
        token: 'test-token',
        linkId: 'test-link',
        urlPassword: '#password123',
        action: 'edit',
      })
    })

    it('handles open-url-download mode with public link', () => {
      const params = createSearchParams({
        mode: 'open-url-download',
        token: 'test-token',
        linkId: 'test-link',
        action: 'edit',
      })

      Object.defineProperty(window, 'location', {
        value: { hash: '#password123' },
      })

      expect(parseOpenAction(params, docPathname)).toEqual({
        type: 'doc',
        mode: 'open-url-download',
        token: 'test-token',
        linkId: 'test-link',
        urlPassword: '#password123',
        action: 'edit',
      })
    })

    it('handles open-url-reauth mode', () => {
      const params = createSearchParams({
        mode: 'open-url-reauth',
        token: 'test-token',
        linkId: 'test-link',
        action: 'view',
      })

      expect(parseOpenAction(params, docPathname)).toEqual({
        type: 'doc',
        mode: 'open-url-reauth',
        token: 'test-token',
        linkId: 'test-link',
        action: 'view',
      })
    })

    it('handles copy-public mode', () => {
      const params = createSearchParams({
        mode: 'copy-public',
      })

      expect(parseOpenAction(params, docPathname)).toEqual({
        mode: 'copy-public',
        type: 'doc',
      })
    })
  })

  describe('private document scenarios', () => {
    it('handles create mode', () => {
      const params = createSearchParams({
        mode: 'create',
        volumeId: 'test-volume',
        parentLinkId: 'parent-link',
      })

      expect(parseOpenAction(params, docPathname)).toEqual({
        type: 'doc',
        mode: 'create',
        volumeId: 'test-volume',
        parentLinkId: 'parent-link',
      })
    })

    it('returns null for create mode without parentLinkId', () => {
      const params = createSearchParams({
        mode: 'create',
        volumeId: 'test-volume',
      })

      expect(parseOpenAction(params, docPathname)).toBeNull()
    })

    const modesRequiringLinkId = ['open', 'convert', 'history', 'download']
    modesRequiringLinkId.forEach((mode) => {
      it(`handles ${mode} mode`, () => {
        const params = createSearchParams({
          mode,
          volumeId: 'test-volume',
          linkId: 'test-link',
        })

        expect(parseOpenAction(params, docPathname)).toEqual({
          type: 'doc',
          mode,
          volumeId: 'test-volume',
          linkId: 'test-link',
        })
      })

      it(`returns null for ${mode} mode without linkId`, () => {
        const params = createSearchParams({
          mode,
          volumeId: 'test-volume',
        })

        expect(parseOpenAction(params, docPathname)).toBeNull()
      })
    })
  })

  describe('default behavior', () => {
    it('defaults to open mode when mode is not specified', () => {
      const params = createSearchParams({
        volumeId: 'test-volume',
        linkId: 'test-link',
      })

      expect(parseOpenAction(params, docPathname)).toEqual({
        type: 'doc',
        mode: 'open',
        volumeId: 'test-volume',
        linkId: 'test-link',
      })
    })

    it('returns null for unknown mode', () => {
      const params = createSearchParams({
        mode: 'invalid-mode',
        volumeId: 'test-volume',
        linkId: 'test-link',
      })

      expect(parseOpenAction(params, docPathname)).toBeNull()
    })
  })
})

describe('replaceLastPathSegment', () => {
  it('should preserve user portion when replacing last segment', () => {
    expect(replaceLastPathSegment('/u/1/foo', 'bar')).toBe('/u/1/bar')
    expect(replaceLastPathSegment('/u/42/something', 'else')).toBe('/u/42/else')
  })

  it('should handle paths without user portion', () => {
    expect(replaceLastPathSegment('/foo', 'bar')).toBe('/bar')
    expect(replaceLastPathSegment('/something', 'else')).toBe('/else')
  })

  it('should handle root path', () => {
    expect(replaceLastPathSegment('/', 'bar')).toBe('/bar')
  })

  it('should handle empty path', () => {
    expect(replaceLastPathSegment('', 'bar')).toBe('/bar')
  })
})
