import { parseOpenAction } from './parseOpenAction'

describe('parseOpenAction', () => {
  const createSearchParams = (params: Record<string, string>) => {
    return new URLSearchParams(params)
  }

  describe('invalid routes', () => {
    it('returns null for empty params', () => {
      expect(parseOpenAction(createSearchParams({}))).toBeNull()
    })

    it('returns null for incomplete params', () => {
      expect(parseOpenAction(createSearchParams({ mode: 'open' }))).toBeNull()
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

      expect(parseOpenAction(params)).toEqual({
        mode: 'open-url',
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

      expect(parseOpenAction(params)).toEqual({
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

      expect(parseOpenAction(params)).toEqual({
        mode: 'copy-public',
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

      expect(parseOpenAction(params)).toEqual({
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

      expect(parseOpenAction(params)).toBeNull()
    })

    const modesRequiringLinkId = ['open', 'convert', 'history', 'download']
    modesRequiringLinkId.forEach((mode) => {
      it(`handles ${mode} mode`, () => {
        const params = createSearchParams({
          mode,
          volumeId: 'test-volume',
          linkId: 'test-link',
        })

        expect(parseOpenAction(params)).toEqual({
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

        expect(parseOpenAction(params)).toBeNull()
      })
    })
  })

  describe('default behavior', () => {
    it('defaults to open mode when mode is not specified', () => {
      const params = createSearchParams({
        volumeId: 'test-volume',
        linkId: 'test-link',
      })

      expect(parseOpenAction(params)).toEqual({
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

      expect(parseOpenAction(params)).toBeNull()
    })
  })
})
