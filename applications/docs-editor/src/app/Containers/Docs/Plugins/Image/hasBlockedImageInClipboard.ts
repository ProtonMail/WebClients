import createDOMPurify, { type Config } from 'dompurify'
import { isAllowedImageSrc } from '../../Conversion/ImageSrcUtils'

// This HTML is inspected only; it must never be attached to the document or used as the pasted content.
const clipboardHtmlConfig: Config & { RETURN_DOM_FRAGMENT: true } = {
  ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|cid|blob|xmpp|data):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i,
  ADD_TAGS: ['proton-src', 'base'],
  ADD_ATTR: ['target', 'proton-src'],
  FORBID_TAGS: ['style', 'input', 'form', 'textarea'],
  FORBID_ATTR: ['srcset', 'for'],
  USE_PROFILES: { html: true },
  ALLOW_UNKNOWN_PROTOCOLS: true,
  WHOLE_DOCUMENT: false,
  RETURN_DOM: true,
  RETURN_DOM_FRAGMENT: true,
}

export function sanitizeClipboardHtml(html: string): DocumentFragment {
  // A fresh instance keeps the inspection independent of other DOMPurify hooks
  // and configuration in the host application.
  return createDOMPurify(window).sanitize(html, clipboardHtmlConfig)
}

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
  const fragment = sanitizeClipboardHtml(clipboardData.getData('text/html'))
  return Array.from(fragment.querySelectorAll('img[src]')).some((image) => {
    const src = image.getAttribute('src') || ''
    return src.length > 0 && !isAllowedImageSrc(src)
  })
}
