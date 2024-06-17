import { UseCaseInterface } from '../Domain/UseCase/UseCaseInterface'
import { Result } from '../Domain/Result/Result'
import { DocumentMetaInterface } from '@proton/docs-shared'
import { DriveCompat, NodeMeta } from '@proton/drive-store'
import { GetDocumentMeta } from './GetDocumentMeta'
import { getErrorString } from '../Util/GetErrorString'
import { DocumentEntitlements, rawPermissionToRole } from '../Types/DocumentEntitlements'

type LoadDocumentResult = {
  entitlements: DocumentEntitlements
  meta: DocumentMetaInterface
  lastCommitId?: string
}

/**
 * Performs initial loading procedure for document, including fetching keys and latest commit binary from DX.
 */
export class LoadDocument implements UseCaseInterface<LoadDocumentResult> {
  constructor(
    private driveCompat: DriveCompat,
    private getDocumentMeta: GetDocumentMeta,
  ) {}
  async execute(lookup: NodeMeta): Promise<Result<LoadDocumentResult>> {
    try {
      const [keysResult, fetchResult, permissionsResult] = await Promise.all([
        this.driveCompat.getDocumentKeys(lookup).catch((error) => {
          throw new Error(`Failed to load keys: ${error}`)
        }),
        this.getDocumentMeta.execute(lookup).catch((error) => {
          throw new Error(`Failed to fetch document metadata: ${error}`)
        }),
        this.driveCompat.getNodePermissions(lookup).catch((error) => {
          throw new Error(`Failed to load permissions: ${error}`)
        }),
      ])

      if (fetchResult.isFailed()) {
        return Result.fail(fetchResult.getError())
      }

      const meta: DocumentMetaInterface = fetchResult.getValue()
      if (!meta) {
        return Result.fail('Document meta not found')
      }

      const lastCommitId = meta.commitIds[meta.commitIds.length - 1]

      if (!keysResult || !permissionsResult) {
        return Result.fail('Unable to load all necessary data')
      }

      const entitlements: DocumentEntitlements = {
        keys: keysResult,
        role: rawPermissionToRole(permissionsResult),
      }

      return Result.ok({ entitlements, meta, lastCommitId })
    } catch (error) {
      return Result.fail(getErrorString(error) ?? 'Failed to load document')
    }
  }
}
