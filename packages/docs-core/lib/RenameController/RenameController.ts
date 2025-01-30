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

  async refreshDocumentName() {
    const { nodeMeta } = this.documentState.getProperty('entitlements')

    const result = await this._getNode.execute(nodeMeta, { useCache: false, forceFetch: true })
    if (result.isFailed()) {
      this.logger.error('Failed to get node', result.getError())
      return
    }

    const { node } = result.getValue()
    this.documentState.setProperty('documentName', node.name)
  }

  public async renameDocument(newName: string): Promise<TranslatedResult<void>> {
    try {
      const decryptedNode = this.documentState.getProperty('decryptedNode')
      if (!decryptedNode.parentNodeId) {
        throw new Error('Cannot rename document')
      }

      const nodeMeta = this.documentState.getProperty('entitlements').nodeMeta
      await this.compat.renamePublicDocument(nodeMeta, decryptedNode.parentNodeId, newName)
      await this.refreshDocumentName()
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

  async refreshDocumentName() {
    const { nodeMeta } = this.documentState.getProperty('entitlements')

    const result = await this._getNode.execute(nodeMeta, { useCache: false, forceFetch: true })
    if (result.isFailed()) {
      this.logger.error('Failed to get node', result.getError())
      return
    }

    const { node } = result.getValue()
    this.documentState.setProperty('documentName', node.name)
  }

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
      await this.refreshDocumentName()
      return TranslatedResult.ok()
    } catch (e) {
      this.logger.error(getErrorString(e) ?? 'Failed to rename document')

      return TranslatedResult.failWithTranslatedError(c('Error').t`Failed to rename document. Please try again later.`)
    }
  }
}
