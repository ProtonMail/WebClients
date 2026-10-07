/**
 * Parses the public link params from the Docs public URL.
 */
export function getPublicLinkUrlParams({ search, hash }: { search: string; hash: string }) {
  const params = new URLSearchParams(search)
  return {
    token: params.get('token') || '',
    linkIdParam: params.get('linkId') || undefined,
    urlPassword: hash.substring(1),
  }
}
