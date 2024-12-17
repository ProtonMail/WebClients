import { replaceLastPathSegment } from './UrlReplacer'

describe('UrlReplacer', () => {
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
