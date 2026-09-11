import * as purify from '@proton/sanitize/purify'
import { hasBlockedImageInClipboard } from './hasBlockedImageInClipboard'

const clipboard = (html: string, lexical = '') =>
  ({ getData: (type: string) => (type === 'text/html' ? html : lexical) }) as DataTransfer

describe('hasBlockedImageInClipboard', () => {
  it('sanitizes hostile markup while retaining remote image detection', () => {
    const sanitize = jest.spyOn(purify, 'content')
    try {
      const html = `<script>alert('script')</script>
        <iframe src="https://example.com/frame"></iframe>
        <img src="https://example.com/image.png" onerror="alert('image')">
        <img src="data:image/png;base64,abc" onload="alert('loaded')">
        <a href="javascript:alert('link')">link</a>`
      expect(hasBlockedImageInClipboard(clipboard(html), 'Docs')).toBe(true)
      expect(sanitize).toHaveBeenCalledWith(html)
      const fragment = sanitize.mock.results[0].value as DocumentFragment
      expect(fragment.isConnected).toBe(false)
      expect(fragment.querySelector('script, iframe, [onerror], [onload], [href^="javascript:"]')).toBeNull()
      expect(Array.from(fragment.querySelectorAll('img')).map((image) => image.getAttribute('src'))).toEqual([
        'https://example.com/image.png',
        'data:image/png;base64,abc',
      ])
    } finally {
      sanitize.mockRestore()
    }
  })

  it.each(['https://example.com/image.png', 'http://example.com/image.png', '/image.png', 'file:///image.png'])(
    'detects blocked source %s in mixed content',
    (src) => {
      expect(hasBlockedImageInClipboard(clipboard(`<p>Before<img src="${src}">After</p>`), 'Docs')).toBe(true)
    },
  )

  it.each(['data:image/png;base64,abc', 'blob:https://example.com/image', ''])('allows source %s', (src) => {
    expect(hasBlockedImageInClipboard(clipboard(`<img src="${src}">`), 'Docs')).toBe(false)
  })

  it('ignores plain text, absent clipboard data, and images without sources', () => {
    expect(hasBlockedImageInClipboard(null, 'Docs')).toBe(false)
    expect(hasBlockedImageInClipboard(clipboard('<p>Text</p><img alt="missing">'), 'Docs')).toBe(false)
  })

  it('uses the internal format when copying within Docs', () => {
    const html = '<img src="https://example.com/image.png">'
    expect(hasBlockedImageInClipboard(clipboard(html, JSON.stringify({ namespace: 'Docs', nodes: [] })), 'Docs')).toBe(
      false,
    )
    expect(hasBlockedImageInClipboard(clipboard(html, JSON.stringify({ namespace: 'Other', nodes: [] })), 'Docs')).toBe(
      true,
    )
    expect(hasBlockedImageInClipboard(clipboard(html, 'invalid JSON'), 'Docs')).toBe(true)
  })
})
