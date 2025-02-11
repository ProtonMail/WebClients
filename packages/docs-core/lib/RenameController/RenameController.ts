import { getErrorString, TranslatedResult } from '@proton/docs-shared'
import type { DocumentState, PublicDocumentState } from '../State/DocumentState'
import type { DriveCompat, PublicDriveCompat } from '@proton/drive-store'
import type { GetNode } from '../UseCase/GetNode'
import type { LoggerInterface } from '@proton/utils/logs'
import { c } from 'ttag'

export interface RenameControllerInterface {
  renameDocument(newName: string): Promise<TranslatedResult<void>>
}

export class PublicRenameController implements RenameControllerInterface {
  constructor(
    private readonly documentState: PublicDocumentState,
    private compat: PublicDriveCompat,
    readonly _getNode: GetNode,
    readonly logger: LoggerInterface,
  ) {}

  public async renameDocument(newName: string): Promise<TranslatedResult<void>> {
    try {
      const decryptedNode = this.documentState.getProperty('decryptedNode')
      if (!decryptedNode.parentNodeId) {
        throw new Error('Cannot rename document')
      }

      const nodeMeta = this.documentState.getProperty('entitlements').nodeMeta
      await this.compat.renamePublicDocument(nodeMeta, decryptedNode.parentNodeId, newName)

      this.documentState.setProperty('documentName', newName)

      void this._getNode.updateNodeNameInCache(nodeMeta, newName)

      return TranslatedResult.ok()
    } catch (e) {
      this.logger.error(getErrorString(e) ?? 'Failed to rename document')

      return TranslatedResult.failWithTranslatedError(c('Error').t`Failed to rename document. Please try again later.`)
    }
  }
}

export class PrivateRenameController implements RenameControllerInterface {
  constructor(
    private readonly documentState: DocumentState,
    private compat: DriveCompat,
    readonly _getNode: GetNode,
    readonly logger: LoggerInterface,
  ) {}

  public async renameDocument(newName: string): Promise<TranslatedResult<void>> {
    try {
      const decryptedNode = this.documentState.getProperty('decryptedNode')
      if (!decryptedNode.parentNodeId) {
        throw new Error('Cannot rename document')
      }

      const nodeMeta = this.documentState.getProperty('entitlements').nodeMeta
      const name = await this.compat.findAvailableNodeName(
        {
          volumeId: decryptedNode.volumeId,
          linkId: decryptedNode.parentNodeId,
        },
        newName,
      )
      await this.compat.renameDocument(nodeMeta, name)

      /**
       * In previous iterations, we would refetch the node after a rename, and set the global documentName property
       * from this refetch.
       * However recent complicated drive-store API changes made it so that the returned node after a fetch, even after
       * invalidating the cache for that node, would return a stale node.
       * Rather than fight against this, we will take the pragmatic approach of just setting the documentName property
       * based on the successful rename result, then update the cache with the new name.
       */
      this.documentState.setProperty('documentName', name)

      void this._getNode.updateNodeNameInCache(nodeMeta, name)

      return TranslatedResult.ok()
    } catch (e) {
      this.logger.error(getErrorString(e) ?? 'Failed to rename document')

      return TranslatedResult.failWithTranslatedError(c('Error').t`Failed to rename document. Please try again later.`)
    }
  }
}
