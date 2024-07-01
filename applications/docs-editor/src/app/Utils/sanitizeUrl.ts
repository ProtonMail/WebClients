export const sanitizeUrl = (url: string): string | undefined => {
  if (url.length === 0) {
    return undefined
  }

  let parsedUrl: URL
  try {
    parsedUrl = new URL(url)
  } catch {
    return undefined
  }

  if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
    return undefined
  }

  return parsedUrl.toString()
}
