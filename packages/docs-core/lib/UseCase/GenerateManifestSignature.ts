import { Commit } from '@proton/docs-proto'
import { Result, UseCaseInterface } from '@standardnotes/domain-core'
import { DriveCompat, NodeMeta } from '@proton/drive-store'
import { stringToUint8Array } from '@proton/shared/lib/helpers/encoding'
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

      const encodedManifestSignature = stringToUint8Array(manifestSignature)

      return Result.ok({
        manifestSignature: encodedManifestSignature,
        signatureAddress,
        encSignature: stringToUint8Array(rawSignature),
        contentHash,
      })
    } catch (error) {
      return Result.fail(getErrorString(error) ?? 'Failed to generate manifest signature')
    }
  }
}
