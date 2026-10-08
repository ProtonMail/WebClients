import { sanitizeUrl } from './sanitizeUrl'

describe('sanitizeUrl', () => {
  it.each([
    ['https://EXAMPLE.com', 'https://example.com/'],
    ['http://example.com:80/path?q=a b#fragment', 'http://example.com/path?q=a%20b#fragment'],
    [' HTTPS://EXAMPLE.COM/path ', 'https://example.com/path'],
    ['https://example.com/%E2%9C%93', 'https://example.com/%E2%9C%93'],
    ['https://例え.テスト', 'https://xn--r8jz45g.xn--zckzah/'],
  ])('accepts and normalizes %s', (url, expected) => {
    const result = sanitizeUrl(url)
    expect(result.isFailed()).toBe(false)
    expect(result.getValue()).toBe(expected)
  })

  it.each([
    ['', 'Empty URL'],
    [' ', 'Invalid URL'],
    ['https://', 'Invalid URL'],
    ['example.com', 'Invalid URL'],
    ['/relative/path', 'Invalid URL'],
    ['https://exa mple.com', 'Invalid URL'],
    ['ftp://example.com', 'Protocol is not http(s)'],
    ['javascript:alert(1)', 'Protocol is not http(s)'],
    ['data:text/html,<script>alert(1)</script>', 'Protocol is not http(s)'],
    ['blob:https://example.com/id', 'Protocol is not http(s)'],
    ['mailto:hello@example.com', 'Protocol is not http(s)'],
  ])('rejects %s with the existing error', (url, expectedError) => {
    const result = sanitizeUrl(url)
    expect(result.isFailed()).toBe(true)
    expect(result.getError()).toBe(expectedError)
    expect(() => result.getValue()).toThrow(`Cannot get value of an unsuccessful result: ${expectedError}`)
  })

  it('keeps both successful and failed results immutable', () => {
    const successful = sanitizeUrl('https://example.com')
    const failed = sanitizeUrl('javascript:alert(1)')
    expect(Object.isFrozen(successful)).toBe(true)
    expect(Object.isFrozen(failed)).toBe(true)
    expect(() => successful.getError()).toThrow('Cannot get an error of a successful result')
  })
})
