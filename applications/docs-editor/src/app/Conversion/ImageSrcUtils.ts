export const isBase64Image = (value = '') =>
  (value.startsWith('data:image') || value.startsWith('data:application/octet-stream')) && value.includes(';base64')

export const isWebpImage = (value = '') => value.startsWith('data:image/webp;base64')

/** Only allow embedded sources to avoid security risk with remote image URLs. */
export const isAllowedImageSrc = (value = '') => isBase64Image(value) || value.startsWith('blob:')

/** Only offer web URLs as recovery links for blocked images. */
export function getRemoteImageUrl(src: string): string | undefined {
  try {
    const url = new URL(src)
    if (url.protocol === 'https:' || url.protocol === 'http:') {
      return url.href
    }
  } catch {
    // Missing or invalid sources cannot be opened safely.
  }
  return undefined
}
