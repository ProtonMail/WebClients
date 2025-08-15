import type { MaybeArray, PrivateKeyReference, PublicKeyReference, SessionKey } from '@proton/crypto'
import type { VERIFICATION_STATUS } from '@proton/crypto'
import { CryptoProxy } from '@proton/crypto'
import { SignedPlaintextContent } from '@proton/docs-proto'
import {
  encryptDataWith16ByteIV as gcmEncryptWith16ByteIV,
  decryptData as gcmDecrypt,
  encryptData,
} from '@proton/crypto/lib/subtle/aesGcm'
import mergeUint8Arrays from '@proton/utils/mergeUint8Arrays'
import { stringToUtf8Array } from '@proton/crypto/lib/utils'
import type { EncryptionContext } from './EncryptionContext'
import { deriveGcmKey } from '../../Crypto/deriveGcmKey'
import { HKDF_SALT_SIZE } from '../../Crypto/Constants'
import { Result } from '@proton/docs-shared'
import type { DriveCompatWrapper } from '@proton/drive-store/lib/DriveCompatWrapper'

export class EncryptionService<C extends EncryptionContext> {
  constructor(
    private context: C,
    private driveCompat: DriveCompatWrapper,
  ) {
    this.context = context
  }

  private getContext(associatedData: string) {
    return `docs.${this.context}.${associatedData}`
  }

  public async signAndEncryptData(
    data: Uint8Array<ArrayBuffer>,
    associatedData: string,
    sessionKey: SessionKey,
    signingKey: PrivateKeyReference,
  ): Promise<Result<Uint8Array<ArrayBuffer>>> {
    try {
      const contextString = this.getContext(associatedData)
      const contextBytes = stringToUtf8Array(contextString)
      const signature = await CryptoProxy.signMessage({
        binaryData: data,
        signingKeys: signingKey,
        signatureContext: { value: contextString, critical: true },
        detached: true,
        format: 'binary',
      })
      const contentToEncrypt = new SignedPlaintextContent({
        content: data,
        signature,
      })

      const hkdfSalt = crypto.getRandomValues(new Uint8Array(HKDF_SALT_SIZE))
      const key = await deriveGcmKey(sessionKey, hkdfSalt, contextBytes)
      const ciphertext = await gcmEncryptWith16ByteIV(key, contentToEncrypt.serializeBinary(), contextBytes)
      return Result.ok(mergeUint8Arrays([hkdfSalt, ciphertext]))
    } catch (error) {
      return Result.fail(`Failed to sign and encrypt data ${error}`)
    }
  }

  public async encryptAnonymousData(
    data: Uint8Array<ArrayBuffer>,
    associatedData: string,
    sessionKey: SessionKey,
  ): Promise<Result<Uint8Array<ArrayBuffer>>> {
    try {
      const contextString = this.getContext(associatedData)
      const contextBytes = stringToUtf8Array(contextString)
      const contentToEncrypt = new SignedPlaintextContent({
        content: data,
      })

      const hkdfSalt = crypto.getRandomValues(new Uint8Array(HKDF_SALT_SIZE))
      const key = await deriveGcmKey(sessionKey, hkdfSalt, contextBytes)
      const ciphertext = await gcmEncryptWith16ByteIV(key, contentToEncrypt.serializeBinary(), contextBytes)
      return Result.ok(mergeUint8Arrays([hkdfSalt, ciphertext]))
    } catch (error) {
      return Result.fail(`Failed to sign and encrypt data ${error}`)
    }
  }

  public async encryptDataForLocalStorage(
    data: Uint8Array<ArrayBuffer>,
    associatedData: string,
    encryptionKey: CryptoKey,
  ): Promise<Result<Uint8Array<ArrayBuffer>>> {
    try {
      const contextBytes = stringToUtf8Array(this.getContext(associatedData))
      const cipherbytes = await encryptData(encryptionKey, data, contextBytes)
      return Result.ok(cipherbytes)
    } catch (error) {
      return Result.fail(`Failed to sign and encrypt data ${error}`)
    }
  }

  public async decryptDataForLocalStorage(
    data: Uint8Array<ArrayBuffer>,
    associatedData: string,
    encryptionKey: CryptoKey,
  ): Promise<Result<Uint8Array<ArrayBuffer>>> {
    try {
      const contextBytes = stringToUtf8Array(this.getContext(associatedData))
      const decryptedData = await gcmDecrypt(encryptionKey, data, contextBytes)
      return Result.ok(decryptedData)
    } catch (error) {
      return Result.fail(`Failed to decrypt data ${error}`)
    }
  }

  public async decryptData(
    encryptedData: Uint8Array<ArrayBuffer>,
    associatedData: string,
    sessionKey: SessionKey,
  ): Promise<Result<SignedPlaintextContent>> {
    try {
      const contextString = this.getContext(associatedData)
      const contextBytes = stringToUtf8Array(contextString)
      const hkdfSalt = encryptedData.subarray(0, HKDF_SALT_SIZE)
      const ciphertext = encryptedData.subarray(HKDF_SALT_SIZE)
      const key = await deriveGcmKey(sessionKey, hkdfSalt, contextBytes)
      const decryptedData = await gcmDecrypt(key, ciphertext, contextBytes, true)

      return Result.ok(SignedPlaintextContent.deserializeBinary(decryptedData))
    } catch (error) {
      return Result.fail(`Failed to decrypt data ${error}`)
    }
  }

  async verifyData(
    data: Uint8Array<ArrayBuffer>,
    signature: Uint8Array<ArrayBuffer>,
    associatedData: string,
    verificationKeys: MaybeArray<PublicKeyReference>,
  ): Promise<Result<VERIFICATION_STATUS>> {
    try {
      const contextString = this.getContext(associatedData)
      const { verificationStatus } = await CryptoProxy.verifyMessage({
        binaryData: data,
        binarySignature: signature,
        verificationKeys,
        signatureContext: { value: contextString, required: true },
        format: 'binary',
      })

      return Result.ok(verificationStatus)
    } catch (error) {
      return Result.fail(`Failed to verify data ${error}`)
    }
  }

  async getVerificationKey(email: string): Promise<Result<PublicKeyReference[]>> {
    try {
      if (this.driveCompat.getCompatType() === 'public') {
        const value = await this.driveCompat.getPublicCompat().getPublicKeysForEmail(email)
        if (!value) {
          return Result.fail(`Failed to get public keys for email in public context`)
        }

        const keys = await Promise.all(value.map((publicKey) => CryptoProxy.importPublicKey({ armoredKey: publicKey })))
        return Result.ok(keys)
      }

      const value = await this.driveCompat.getUserCompat().getVerificationKey(email)

      return Result.ok(value)
    } catch (error) {
      return Result.fail(`Failed to get verification key ${error}`)
    }
  }
}
