import { content as sanitizeContent } from '@proton/sanitize/purify'
import { isAllowedImageSrc } from '../../Conversion/ImageSrcUtils'

export function hasBlockedImageInClipboard(clipboardData: DataTransfer | null, namespace: string): boolean {
  if (!clipboardData) {
    return false
  }

  // Lexical prefers its own format over HTML when copying within Docs.
  try {
    const payload = JSON.parse(clipboardData.getData('application/x-lexical-editor'))
    if (payload?.namespace === namespace && Array.isArray(payload.nodes)) {
      return false
    }
  } catch {
    // Like Lexical, fall back to HTML when the internal payload is invalid.
  }

  // Inspect a sanitized, detached fragment without inserting clipboard markup into the document.
  const fragment = sanitizeContent(clipboardData.getData('text/html')) as DocumentFragment
  return Array.from(fragment.querySelectorAll('img[src]')).some((image) => {
    const src = image.getAttribute('src') || ''
    return src.length > 0 && !isAllowedImageSrc(src)
  })
}
