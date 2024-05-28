import { SessionKey } from '@proton/crypto'
import { HKDF_SALT_SIZE } from './Constants'

export async function deriveGcmKey(sessionKey: SessionKey, salt: Uint8Array, info: Uint8Array) {
  if (sessionKey.algorithm !== 'aes256') {
    throw new Error('Unexpected session key algorithm')
  }

  if (salt.length !== HKDF_SALT_SIZE) {
    throw new Error('Unexpected salt size')
  }

  const key = await crypto.subtle.importKey('raw', sessionKey.data, 'HKDF', false, ['deriveKey'])

  return crypto.subtle.deriveKey(
    { name: 'HKDF', salt, info, hash: 'SHA-256' },
    key,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  )
}
