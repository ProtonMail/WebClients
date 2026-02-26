/**
 * Get the hash of a buffer
 * @param content - The buffer to hash
 * @param algorithm - The algorithm to use (default: SHA-1)
 * @returns The hash of the buffer
 */
export async function getBufferHash(
  content: BufferSource,
  algorithm: Parameters<typeof window.crypto.subtle.digest>[0] = 'SHA-1',
) {
  const hash = await window.crypto.subtle.digest(algorithm, content)
  const hashHex = Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
  return hashHex
}
