import { getCanWrite } from '@proton/shared/lib/drive/permissions'
import { Result } from '@proton/docs-shared'
import { DocumentRole, type DocumentMetaInterface } from '@proton/docs-shared'
import type { NodeMeta, PublicNodeMeta, DecryptedNode, PublicDriveCompat, DriveCompat } from '@proton/drive-store'
import type { GetDocumentMeta } from './GetDocumentMeta'
import { getErrorString } from '../Util/GetErrorString'
import type { DocumentEntitlements, PublicDocumentEntitlements } from '../Types/DocumentEntitlements'
import { rawPermissionToRole } from '../Types/DocumentEntitlements'
import type { GetNode } from './GetNode'
import type { DriveCompatWrapper } from '@proton/drive-store/lib/DriveCompatWrapper'
import type { LoadCommit } from './LoadCommit'
import type { LoggerInterface } from '@proton/utils/logs'
import type { DecryptedCommit } from '../Models/DecryptedCommit'
import { LoadLogger } from '../LoadLogger/LoadLogger'

type LoadDocumentResult<E extends DocumentEntitlements | PublicDocumentEntitlements> = {
  entitlements: E
  meta: DocumentMetaInterface
  node: DecryptedNode
  decryptedCommit?: DecryptedCommit
}

/**
 * Performs initial loading procedure for document, including fetching keys and latest commit binary from DX.
 */
export class LoadDocument {
  constructor(
    private compatWrapper: DriveCompatWrapper<DriveCompat | PublicDriveCompat>,
    private getDocumentMeta: GetDocumentMeta,
    private getNode: GetNode,
    private loadCommit: LoadCommit,
    private logger: LoggerInterface,
  ) {}

  async executePrivate(nodeMeta: NodeMeta): Promise<Result<LoadDocumentResult<DocumentEntitlements>>> {
    const compat = this.compatWrapper.getCompat<DriveCompat>()
    try {
      const [nodeResult, keysResult, fetchResult, permissionsResult] = await Promise.all([
        this.getNode
          .execute(nodeMeta)
          .then((result) => {
            LoadLogger.logEventRelativeToLoadTime('[LoadDocument] getNode')
            return result
          })
          .catch((error) => {
            throw new Error(`Failed to load node: ${error}`)
          }),
        compat
          .getDocumentKeys(nodeMeta)
          .then((result) => {
            LoadLogger.logEventRelativeToLoadTime('[LoadDocument] getDocumentKeys')
            return result
          })
          .catch((error) => {
            throw new Error(`Failed to load keys: ${error}`)
          }),
        this.getDocumentMeta
          .execute(nodeMeta)
          .then((result) => {
            LoadLogger.logEventRelativeToLoadTime('[LoadDocument] getDocumentMeta')
            return result
          })
          .catch((error) => {
            throw new Error(`Failed to fetch document metadata: ${error}`)
          }),
        compat
          .getNodePermissions(nodeMeta)
          .then((result) => {
            LoadLogger.logEventRelativeToLoadTime('[LoadDocument] getNodePermissions')
            return result
          })
          .catch((error) => {
            throw new Error(`Failed to load permissions: ${error}`)
          }),
      ])

      LoadLogger.logEventRelativeToLoadTime('[LoadDocument] All network requests')

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
        nodeMeta,
      }

      const latestCommitId = serverBasedMeta.latestCommitId()
      let decryptedCommit: DecryptedCommit | undefined

      if (latestCommitId) {
        const decryptResult = await this.loadCommit.execute(
          nodeMeta,
          latestCommitId,
          entitlements.keys.documentContentKey,
        )
        if (decryptResult.isFailed()) {
          return Result.fail(decryptResult.getError())
        }

        decryptedCommit = decryptResult.getValue()
        this.logger.info(`Downloaded and decrypted commit with ${decryptedCommit?.numberOfUpdates()} updates`)
      }

      return Result.ok({ entitlements, meta: decryptedMeta, node: node, decryptedCommit })
    } catch (error) {
      return Result.fail(getErrorString(error) ?? 'Failed to load document')
    }
  }

  async executePublic(
    nodeMeta: PublicNodeMeta,
    publicEditingEnabled: boolean,
  ): Promise<Result<LoadDocumentResult<PublicDocumentEntitlements>>> {
    const compat = this.compatWrapper.getCompat<PublicDriveCompat>()
    const permissions = compat.permissions

    if (!permissions) {
      return Result.fail('Permissions not yet loaded')
    }

    try {
      const [nodeResult, keysResult, fetchResult] = await Promise.all([
        this.getNode.execute(nodeMeta).catch((error) => {
          throw new Error(`Failed to load public node: ${error}`)
        }),
        compat.getDocumentKeys(nodeMeta).catch((error) => {
          throw new Error(`Failed to load public keys: ${error}`)
        }),
        this.getDocumentMeta.execute(nodeMeta).catch((error) => {
          throw new Error(`Failed to fetch document metadata: ${error}`)
        }),
      ])

      const decryptedNode = nodeResult.getValue().node

      if (fetchResult.isFailed()) {
        return Result.fail(fetchResult.getError())
      }

      const serverBasedMeta: DocumentMetaInterface = fetchResult.getValue()
      if (!serverBasedMeta) {
        return Result.fail('Document meta not found')
      }

      const decryptedMeta = serverBasedMeta.copyWithNewValues({ name: decryptedNode.name })

      if (!keysResult) {
        return Result.fail('Unable to load all necessary data')
      }

      /**
       * We attempt to determine if the current public session user can load the actual document meta via the
       * authenticated API.
       *
       * If it succeeds, this means the user has some sort of access to this document, and can perform
       * actions like duplicating it.
       */
      const authenticatedMetaAttempt = await this.getDocumentMeta.execute({
        volumeId: decryptedMeta.volumeId,
        linkId: nodeMeta.linkId,
      })

      const doesHaveAccessToDoc = !authenticatedMetaAttempt.isFailed()

      const role = (() => {
        if (publicEditingEnabled && getCanWrite(permissions)) {
          return new DocumentRole('PublicEditor')
        }
        if (doesHaveAccessToDoc) {
          return new DocumentRole('PublicViewerWithAccess')
        }
        return new DocumentRole('PublicViewer')
      })()

      const entitlements: PublicDocumentEntitlements = {
        keys: keysResult,
        role,
        nodeMeta,
      }

      const latestCommitId = serverBasedMeta.latestCommitId()
      let decryptedCommit: DecryptedCommit | undefined

      if (latestCommitId) {
        const decryptResult = await this.loadCommit.execute(
          nodeMeta,
          latestCommitId,
          entitlements.keys.documentContentKey,
        )
        if (decryptResult.isFailed()) {
          return Result.fail(decryptResult.getError())
        }

        decryptedCommit = decryptResult.getValue()
        this.logger.info(`Downloaded and decrypted commit with ${decryptedCommit?.numberOfUpdates()} updates`)
      }

      return Result.ok({ entitlements, meta: decryptedMeta, node: decryptedNode, decryptedCommit })
    } catch (error) {
      return Result.fail(getErrorString(error) ?? 'Failed to load document')
    }
  }
}
