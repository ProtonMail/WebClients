import type { UseCaseInterface } from '../Domain/UseCase/UseCaseInterface'
import { Result } from '../Domain/Result/Result'
import type { DocumentMetaInterface } from '@proton/docs-shared'
import type { DriveCompat, NodeMeta } from '@proton/drive-store'
import type { GetDocumentMeta } from './GetDocumentMeta'
import { getErrorString } from '../Util/GetErrorString'
import type { DocumentEntitlements } from '../Types/DocumentEntitlements'
import { rawPermissionToRole } from '../Types/DocumentEntitlements'

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

      if (!keysResult || !permissionsResult) {
        return Result.fail('Unable to load all necessary data')
      }

      const entitlements: DocumentEntitlements = {
        keys: keysResult,
        role: rawPermissionToRole(permissionsResult),
      }

      return Result.ok({ entitlements, meta, lastCommitId: meta.latestCommitId() })
    } catch (error) {
      return Result.fail(getErrorString(error) ?? 'Failed to load document')
    }
  }
}
