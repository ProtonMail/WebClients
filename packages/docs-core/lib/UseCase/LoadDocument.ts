import { Result } from '../Domain/Result/Result'
import { DocumentRole, type DocumentMetaInterface } from '@proton/docs-shared'
import type { NodeMeta, PublicNodeMeta, DecryptedNode } from '@proton/drive-store'
import type { GetDocumentMeta } from './GetDocumentMeta'
import { getErrorString } from '../Util/GetErrorString'
import type { DocumentEntitlements, PublicDocumentEntitlements } from '../Types/DocumentEntitlements'
import { rawPermissionToRole } from '../Types/DocumentEntitlements'
import type { GetNode } from './GetNode'
import type { DriveCompatWrapper } from '@proton/drive-store/lib/DriveCompatWrapper'

type LoadDocumentResult<E extends DocumentEntitlements | PublicDocumentEntitlements> = {
  entitlements: E
  meta: DocumentMetaInterface
  node: DecryptedNode
  lastCommitId?: string
}

/**
 * Performs initial loading procedure for document, including fetching keys and latest commit binary from DX.
 */
export class LoadDocument {
  constructor(
    private compatWrapper: DriveCompatWrapper,
    private getDocumentMeta: GetDocumentMeta,
    private getNode: GetNode,
  ) {}

  async executePrivate(nodeMeta: NodeMeta): Promise<Result<LoadDocumentResult<DocumentEntitlements>>> {
    if (!this.compatWrapper.userCompat) {
      return Result.fail('User drive compat not found')
    }
    try {
      const [nodeResult, keysResult, fetchResult, permissionsResult] = await Promise.all([
        this.getNode.execute(nodeMeta),
        this.compatWrapper.userCompat.getDocumentKeys(nodeMeta).catch((error) => {
          throw new Error(`Failed to load keys: ${error}`)
        }),
        this.getDocumentMeta.execute(nodeMeta).catch((error) => {
          throw new Error(`Failed to fetch document metadata: ${error}`)
        }),
        this.compatWrapper.userCompat.getNodePermissions(nodeMeta).catch((error) => {
          throw new Error(`Failed to load permissions: ${error}`)
        }),
      ])

      if (fetchResult.isFailed()) {
        return Result.fail(fetchResult.getError())
      }

      if (nodeResult.isFailed()) {
        return Result.fail(nodeResult.getError())
      }
      const node = nodeResult.getValue().node

      const serverBasedMeta: DocumentMetaInterface = fetchResult.getValue()
      if (!serverBasedMeta) {
        return Result.fail('Document meta not found')
      }

      const decryptedMeta = serverBasedMeta.copyWithNewValues({ name: node.name })

      if (!permissionsResult) {
        return Result.fail('Unable to load permissions')
      }

      if (!keysResult) {
        return Result.fail('Unable to load all necessary data')
      }

      const entitlements: DocumentEntitlements = {
        keys: keysResult,
        role: permissionsResult ? rawPermissionToRole(permissionsResult) : new DocumentRole('PublicViewer'),
      }

      return Result.ok({ entitlements, meta: decryptedMeta, node: node, lastCommitId: decryptedMeta.latestCommitId() })
    } catch (error) {
      return Result.fail(getErrorString(error) ?? 'Failed to load document')
    }
  }

  async executePublic(nodeMeta: PublicNodeMeta): Promise<Result<LoadDocumentResult<PublicDocumentEntitlements>>> {
    if (!this.compatWrapper.publicCompat) {
      return Result.fail('Public drive compat not found')
    }

    try {
      const [nodeResult, keysResult, fetchResult] = await Promise.all([
        this.getNode.execute(nodeMeta),
        this.compatWrapper.publicCompat.getDocumentKeys(nodeMeta).catch((error) => {
          throw new Error(`Failed to load public keys: ${error}`)
        }),
        this.getDocumentMeta.execute(nodeMeta).catch((error) => {
          throw new Error(`Failed to fetch document metadata: ${error}`)
        }),
      ])

      if (fetchResult.isFailed()) {
        return Result.fail(fetchResult.getError())
      }

      const serverBasedMeta: DocumentMetaInterface = fetchResult.getValue()
      if (!serverBasedMeta) {
        return Result.fail('Document meta not found')
      }

      const node = nodeResult.getValue().node
      const decryptedMeta = serverBasedMeta.copyWithNewValues({ name: node.name })

      if (!keysResult) {
        return Result.fail('Unable to load all necessary data')
      }

      const entitlements: PublicDocumentEntitlements = {
        keys: keysResult,
        role: new DocumentRole('PublicViewer'),
      }

      return Result.ok({ entitlements, meta: decryptedMeta, node: node, lastCommitId: decryptedMeta.latestCommitId() })
    } catch (error) {
      return Result.fail(getErrorString(error) ?? 'Failed to load document')
    }
  }
}
