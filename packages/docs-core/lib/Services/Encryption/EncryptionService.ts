import type {
  MaybeArray,
  PrivateKeyReference,
  PublicKeyReference,
  SessionKey,
  VERIFICATION_STATUS,
} from '@proton/crypto'
import { CryptoProxy } from '@proton/crypto'
import { SignedPlaintextContent } from '@proton/docs-proto'
import { encryptData as gcmEncrypt, decryptData as gcmDecrypt } from '@proton/shared/lib/authentication/cryptoHelper'
import mergeUint8Arrays from '@proton/utils/mergeUint8Arrays'
import { stringToUtf8Array } from '@proton/crypto/lib/utils'
import type { EncryptionContext } from './EncryptionContext'
import { deriveGcmKey } from '../../Crypto/deriveGcmKey'
import { HKDF_SALT_SIZE } from '../../Crypto/Constants'
import { Result } from '../../Domain/Result/Result'
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
    data: Uint8Array,
    associatedData: string,
    sessionKey: SessionKey,
    signingKey: PrivateKeyReference,
  ): Promise<Result<Uint8Array>> {
    try {
      const contextString = this.getContext(associatedData)
      const contextBytes = stringToUtf8Array(contextString)
      const signature = await CryptoProxy.signMessage({
        binaryData: data,
        signingKeys: signingKey,
        context: { value: contextString, critical: true },
        detached: true,
        format: 'binary',
      })
      const contentToEncrypt = new SignedPlaintextContent({
        content: data,
        signature,
      })

      const hkdfSalt = crypto.getRandomValues(new Uint8Array(HKDF_SALT_SIZE))
      const key = await deriveGcmKey(sessionKey, hkdfSalt, contextBytes)
      const ciphertext = await gcmEncrypt(key, contentToEncrypt.serializeBinary(), contextBytes)
      return Result.ok(mergeUint8Arrays([hkdfSalt, ciphertext]))
    } catch (error) {
      return Result.fail(`Failed to sign and encrypt data ${error}`)
    }
  }

  public async decryptData(
    encryptedData: Uint8Array,
    associatedData: string,
    sessionKey: SessionKey,
  ): Promise<Result<SignedPlaintextContent>> {
    try {
      const contextString = this.getContext(associatedData)
      const contextBytes = stringToUtf8Array(contextString)
      const hkdfSalt = encryptedData.subarray(0, HKDF_SALT_SIZE)
      const ciphertext = encryptedData.subarray(HKDF_SALT_SIZE)
      const key = await deriveGcmKey(sessionKey, hkdfSalt, contextBytes)
      const decryptedData = await gcmDecrypt(key, ciphertext, contextBytes)

      return Result.ok(SignedPlaintextContent.deserializeBinary(decryptedData))
    } catch (error) {
      return Result.fail(`Failed to decrypt data ${error}`)
    }
  }

  async verifyData(
    data: Uint8Array,
    signature: Uint8Array,
    associatedData: string,
    verificationKeys: MaybeArray<PublicKeyReference>,
  ): Promise<Result<VERIFICATION_STATUS>> {
    try {
      const contextString = this.getContext(associatedData)
      const { verified } = await CryptoProxy.verifyMessage({
        binaryData: data,
        binarySignature: signature,
        verificationKeys,
        context: { value: contextString, required: true },
        format: 'binary',
      })

      return Result.ok(verified)
    } catch (error) {
      return Result.fail(`Failed to verify data ${error}`)
    }
  }

  async getVerificationKey(email: string): Promise<Result<PublicKeyReference[]>> {
    if (!this.driveCompat.userCompat) {
      return Result.fail('User compat not available')
    }

    try {
      const value = await this.driveCompat.userCompat.getVerificationKey(email)

      return Result.ok(value)
    } catch (error) {
      return Result.fail(`Failed to get verification key ${error}`)
    }
  }
}
