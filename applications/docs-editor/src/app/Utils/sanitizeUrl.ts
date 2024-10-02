import { Result } from '@proton/docs-shared'

export const sanitizeUrl = (url: string): Result<string> => {
  if (url.length === 0) {
    return Result.fail('Empty URL')
  }

  let parsedUrl: URL
  try {
    parsedUrl = new URL(url)
  } catch {
    return Result.fail('Invalid URL')
  }

  if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
    return Result.fail('Protocol is not http(s)')
  }

  return Result.ok(parsedUrl.toString())
}
