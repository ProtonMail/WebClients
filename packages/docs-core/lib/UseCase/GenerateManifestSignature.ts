import { stringToUtf8Array } from '@proton/crypto/lib/utils'
import { Commit } from '@proton/docs-proto'
import { UseCaseInterface } from '../Domain/UseCase/UseCaseInterface'
import { Result } from '../Domain/Result/Result'
import { DriveCompat, NodeMeta } from '@proton/drive-store'
import { getErrorString } from '../Util/GetErrorString'

type ReturnValue = {
  manifestSignature: Uint8Array
  signatureAddress: string
  encSignature: Uint8Array
  contentHash: Uint8Array
}

export class GenerateManifestSignature implements UseCaseInterface<ReturnValue> {
  constructor(private driveCompat: DriveCompat) {}

  async execute(lookup: NodeMeta, commit: Commit): Promise<Result<ReturnValue>> {
    const data = commit.serializeBinary()

    try {
      const { manifestSignature, signatureAddress } = await this.driveCompat.signDocumentManifest(lookup, data)
      const { signature: rawSignature, hash: contentHash } = await this.driveCompat.signDocumentData(lookup, data)

      const encodedManifestSignature = stringToUtf8Array(manifestSignature)

      return Result.ok({
        manifestSignature: encodedManifestSignature,
        signatureAddress,
        encSignature: stringToUtf8Array(rawSignature),
        contentHash,
      })
    } catch (error) {
      return Result.fail(getErrorString(error) ?? 'Failed to generate manifest signature')
    }
  }
}
