import type { SessionKey } from '@protontech/crypto'
import { HKDF_SALT_SIZE } from './Constants'
import { deriveKey } from '@protontech/crypto/subtle/aesGcm.ts'

export async function deriveGcmKey(sessionKey: SessionKey, salt: Uint8Array<ArrayBuffer>, info: Uint8Array<ArrayBuffer>) {
  if (sessionKey.algorithm !== 'aes256') {
    throw new Error('Unexpected session key algorithm')
  }

  if (salt.length !== HKDF_SALT_SIZE) {
    throw new Error('Unexpected salt size')
  }

  return deriveKey(sessionKey.data, salt, info)
}
