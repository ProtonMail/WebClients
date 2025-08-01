import { c } from 'ttag'
import type { SquashDocument } from '../UseCase/SquashDocument'
import type { DuplicateDocument } from '../UseCase/DuplicateDocument'
import type { CreateNewDocument } from '../UseCase/CreateNewDocument'
import type { DriveCompat } from '@proton/drive-store'
import type { InternalEventBusInterface, YjsState } from '@proton/docs-shared'
import type { AuthenticatedDocControllerInterface } from './AuthenticatedDocControllerInterface'
import type { SeedInitialCommit } from '../UseCase/SeedInitialCommit'
import type { VersionHistoryUpdate } from '../VersionHistory'
import { NativeVersionHistory } from '../VersionHistory'
import { DocControllerEvent } from './AuthenticatedDocControllerEvent'

import type { DocsClientSquashVerificationObjectionMadePayload } from '../Application/ApplicationEvent'
import { ApplicationEvent, PostApplicationError } from '../Application/ApplicationEvent'
import type { SquashVerificationObjectionCallback } from '../Types/SquashVerificationObjection'
import { TranslatedResult } from '@proton/docs-shared'
import type { Result } from '@proton/docs-shared'
import { getPlatformFriendlyDateForFileName } from '@proton/shared/lib/docs/utils/getPlatformFriendlyDateForFileName'
import { MAX_DOC_SIZE } from '../Models/Constants'
import type { GetNode } from '../UseCase/GetNode'
import { isDocumentState, type DocumentState } from '../State/DocumentState'
import type { LoggerInterface } from '@proton/utils/logs'
import { getErrorString } from '../Util/GetErrorString'
import type { DocumentType } from '@proton/drive-store/store/_documents'
import { isProtonDocsSpreadsheet } from '@proton/shared/lib/helpers/mimetype'

// This is part of a hack to make sure the name in the document sharing modal is updated when the document name changes.
// While having these module-scoped variable here looks a bit stinky, it's completely fine because the purpose is to prevent a
// memory leak by re-setting it every time the modal is opened.
let OVERRIDDEN_NAME_CLEANUP = () => {}
let OVERRIDDEN_NAME_LISTENERS = new Set<(name: string) => void>()

/**
 * Controls the lifecycle of a single document for an authenticated user.
 */
export class AuthenticatedDocController implements AuthenticatedDocControllerInterface {
  isDestroyed = false
  didTrashDocInCurrentSession = false
  /** Used for history tracking in Version History */
  receivedOrSentDUs: VersionHistoryUpdate[] = []

  constructor(
    private readonly documentState: DocumentState,
    private driveCompat: DriveCompat,
    private _squashDocument: SquashDocument,
    readonly _createInitialCommit: SeedInitialCommit,
    private _duplicateDocument: DuplicateDocument,
    private _createNewDocument: CreateNewDocument,
    readonly _getNode: GetNode,
    readonly eventBus: InternalEventBusInterface,
    readonly logger: LoggerInterface,
  ) {
    this.subscribeToEvents()
  }

  destroy(): void {
    this.isDestroyed = true
  }

  subscribeToEvents(): void {
    this.documentState.subscribeToProperty('baseCommit', (value) => {
      if (value && value.needsSquash()) {
        void this.squashDocument()
      }
    })

    this.documentState.subscribeToEvent('EditorRequestsPropagationOfUpdate', (payload) => {
      if (this.isDestroyed) {
        return
      }

      if (payload.message.type.wrapper === 'conversion') {
        void this.handleEditorProvidingInitialConversionContent(payload.message.content)
      } else if (payload.message.type.wrapper === 'du') {
        this.receivedOrSentDUs.push({
          content: payload.message.content,
          timestamp: Date.now(),
        })
      }
    })

    this.documentState.subscribeToProperty('baseCommit', (value) => {
      if (value) {
        this.receivedOrSentDUs = []
      }
    })

    this.documentState.subscribeToEvent('RealtimeReceivedDocumentUpdate', (payload) => {
      this.receivedOrSentDUs.push(payload)
    })
  }

  public getVersionHistory(): NativeVersionHistory | undefined {
    const updates = [...(this.documentState.getProperty('baseCommit')?.messages ?? []), ...this.receivedOrSentDUs]

    return updates.length > 0 ? new NativeVersionHistory(updates) : undefined
  }

  /**
   *
   * @param imposeTrashState getNode may return a cached value, due to a race condition with DriveCompat where the node
   * is removed from cache but done asyncronously. So the refetch below might return a cached value when we are expecting
   * a fresh reloaded value. This should ultimately be fixed with the DriveCompat but goes too deep into its functionality
   * to do so.
   */
  async refreshNodeAndDocMeta(options: { imposeTrashState: 'trashed' | 'not_trashed' | undefined }): Promise<void> {
    const { nodeMeta } = this.documentState.getProperty('entitlements')

    const result = await this._getNode.execute(nodeMeta, { useCache: false, forceFetch: true })
    if (result.isFailed()) {
      this.logger.error('Failed to get node', result.getError())
      return
    }

    const { node } = result.getValue()
    this.documentState.setProperty('decryptedNode', node)
    this.documentState.setProperty('documentName', node.name)

    if (options.imposeTrashState) {
      this.documentState.setProperty('documentTrashState', options.imposeTrashState)
    } else {
      this.documentState.setProperty('documentTrashState', node.trashed ? 'trashed' : 'not_trashed')
    }
  }

  async handleEditorProvidingInitialConversionContent(content: Uint8Array): Promise<void> {
    this.logger.info('Received conversion content from editor, seeding initial commit of size', content.byteLength)

    this.documentState.emitEvent({
      name: 'DriveFileConversionToDocBegan',
      payload: undefined,
    })

    if (content.byteLength >= MAX_DOC_SIZE) {
      this.logger.info('Initial conversion content is too large')

      PostApplicationError(this.eventBus, {
        translatedError: c('Error')
          .t`The document you are trying to convert is too large. This may occur if the document has a large number of images or other media. Please try again with a smaller document.`,
        irrecoverable: true,
      })

      return
    }

    const result = await this.createInitialCommit(content)

    if (result.isFailed()) {
      PostApplicationError(this.eventBus, {
        translatedError: c('Error').t`An error occurred while attempting to convert the document. Please try again.`,
        irrecoverable: true,
      })

      return
    }

    this.documentState.emitEvent({
      name: 'DriveFileConversionToDocSucceeded',
      payload: undefined,
    })
  }

  public async debugSendCommitCommandToRTS(): Promise<void> {
    if (!isDocumentState(this.documentState)) {
      return
    }

    this.documentState.emitEvent({
      name: 'DebugMenuRequestingCommitWithRTS',
      payload: this.documentState.getProperty('entitlements'),
    })
  }

  public async createInitialCommit(content: Uint8Array): Promise<Result<unknown>> {
    if (!isDocumentState(this.documentState)) {
      throw new Error('Cannot perform createInitialCommit as a public user')
    }

    const result = await this._createInitialCommit.execute(
      this.documentState.getProperty('entitlements').nodeMeta,
      content,
      this.documentState.getProperty('entitlements').keys,
    )

    if (result.isFailed()) {
      this.logger.error('Failed to seed document', result.getError())
    } else {
      const resultValue = result.getValue()
      this.documentState.setProperty('currentCommitId', resultValue.commitId)
    }

    return result
  }

  public async squashDocument(): Promise<void> {
    if (!isDocumentState(this.documentState)) {
      throw new Error('Cannot perform squashDocument as a public user')
    }

    const baseCommit = this.documentState.getProperty('baseCommit')
    if (!baseCommit) {
      this.logger.info('No initial commit to squash')
      return
    }

    this.logger.info('Squashing document')

    const handleVerificationObjection: SquashVerificationObjectionCallback = async () => {
      this.eventBus.publish({
        type: DocControllerEvent.SquashVerificationObjectionDecisionRequired,
        payload: undefined,
      })

      return new Promise((resolve) => {
        const disposer = this.eventBus.addEventCallback((data: DocsClientSquashVerificationObjectionMadePayload) => {
          disposer()
          resolve(data.decision)
        }, ApplicationEvent.SquashVerificationObjectionDecisionMade)
      })
    }

    const { keys, nodeMeta } = this.documentState.getProperty('entitlements')

    const result = await this._squashDocument.execute({
      nodeMeta,
      commitId: baseCommit.commitId,
      keys,
      handleVerificationObjection,
    })

    if (result.isFailed()) {
      this.logger.error('Failed to squash document', result.getError())
    } else {
      this.logger.info('Squash result', result.getValue())
    }
  }

  public async duplicateDocument(editorYjsState: Uint8Array): Promise<void> {
    const node = this.documentState.getProperty('decryptedNode')
    const result = await this._duplicateDocument.executePrivate(
      this.documentState.getProperty('entitlements').nodeMeta,
      node,
      editorYjsState,
    )

    if (result.isFailed()) {
      this.logger.error('Failed to duplicate document', result.getError())

      PostApplicationError(this.eventBus, {
        translatedError: c('Error').t`An error occurred while attempting to duplicate the document. Please try again.`,
      })

      return
    }

    const shell = result.getValue()

    void this.driveCompat.openDocument(shell, isProtonDocsSpreadsheet(node.mimeType) ? 'sheet' : 'doc')
  }

  public async restoreRevisionAsCopy(yjsContent: YjsState): Promise<void> {
    const node = this.documentState.getProperty('decryptedNode')
    const result = await this._duplicateDocument.executePrivate(
      this.documentState.getProperty('entitlements').nodeMeta,
      node,
      yjsContent,
    )

    if (result.isFailed()) {
      this.logger.error('Failed to restore document as copy', result.getError())

      PostApplicationError(this.eventBus, {
        translatedError: c('Error').t`An error occurred while attempting to restore the document. Please try again.`,
      })

      return
    }

    const shell = result.getValue()

    void this.driveCompat.openDocument(shell, isProtonDocsSpreadsheet(node.mimeType) ? 'sheet' : 'doc')
  }

  public async createNewDocument(documentType: DocumentType): Promise<void> {
    const date = getPlatformFriendlyDateForFileName()
    // translator: Default title for a new Proton Document (example: Untitled document 2024-04-23)
    const docTitle = c('Title').t`Untitled document ${date}`
    const sheetTitle = c('Title').t`Untitled spreadsheet ${date}`
    const baseTitle = documentType === 'sheet' ? sheetTitle : docTitle
    const newName = `${baseTitle}`

    const result = await this._createNewDocument.execute(
      newName,
      this.documentState.getProperty('entitlements').nodeMeta,
      this.documentState.getProperty('decryptedNode'),
      documentType,
    )

    if (result.isFailed()) {
      this.logger.error('Failed to create new document', result.getError())

      PostApplicationError(this.eventBus, {
        translatedError: c('Error').t`An error occurred while creating a new document. Please try again.`,
      })

      return
    }

    const shell = result.getValue()

    void this.driveCompat.openDocument(shell, documentType)
  }

  public async renameDocument(newName: string): Promise<TranslatedResult<void>> {
    try {
      const decryptedNode = this.documentState.getProperty('decryptedNode')
      if (!decryptedNode.parentNodeId) {
        throw new Error('Cannot rename document')
      }

      const name = await this.driveCompat.findAvailableNodeName(
        {
          volumeId: decryptedNode.volumeId,
          linkId: decryptedNode.parentNodeId,
        },
        newName,
      )
      await this.driveCompat.renameDocument(this.documentState.getProperty('entitlements').nodeMeta, name)
      await this.refreshNodeAndDocMeta({ imposeTrashState: undefined })
      return TranslatedResult.ok()
    } catch (e) {
      this.logger.error(getErrorString(e) ?? 'Failed to rename document')

      return TranslatedResult.failWithTranslatedError(c('Error').t`Failed to rename document. Please try again later.`)
    }
  }

  public async trashDocument(): Promise<void> {
    this.documentState.setProperty('documentTrashState', 'trashing')

    try {
      const decryptedNode = this.documentState.getProperty('decryptedNode')
      const parentLinkId = decryptedNode.parentNodeId || (await this.driveCompat.getMyFilesNodeMeta()).linkId
      await this.driveCompat.trashDocument(this.documentState.getProperty('entitlements').nodeMeta, parentLinkId)

      await this.refreshNodeAndDocMeta({ imposeTrashState: 'trashed' })

      this.didTrashDocInCurrentSession = true
    } catch (error) {
      this.logger.error(getErrorString(error) ?? 'Failed to trash document')

      PostApplicationError(this.eventBus, {
        translatedError: c('Error').t`An error occurred while attempting to trash the document. Please try again.`,
      })
      this.documentState.setProperty('documentTrashState', 'not_trashed')
    }
  }

  public async restoreDocument(): Promise<void> {
    this.documentState.setProperty('documentTrashState', 'restoring')

    try {
      const decryptedNode = this.documentState.getProperty('decryptedNode')
      const parentLinkId = decryptedNode.parentNodeId || (await this.driveCompat.getMyFilesNodeMeta()).linkId
      await this.driveCompat.restoreDocument(this.documentState.getProperty('entitlements').nodeMeta, parentLinkId)

      await this.refreshNodeAndDocMeta({ imposeTrashState: 'not_trashed' })
    } catch (error) {
      this.logger.error(getErrorString(error) ?? 'Failed to restore document')

      PostApplicationError(this.eventBus, {
        translatedError: c('Error').t`An error occurred while attempting to restore the document. Please try again.`,
      })
      this.documentState.setProperty('documentTrashState', 'trashed')
    }
  }

  public openDocumentSharingModal(): void {
    OVERRIDDEN_NAME_CLEANUP()
    OVERRIDDEN_NAME_LISTENERS.clear()
    OVERRIDDEN_NAME_LISTENERS = new Set<(name: string) => void>()
    OVERRIDDEN_NAME_CLEANUP = this.documentState.subscribeToProperty('documentName', (name) => {
      for (const listener of OVERRIDDEN_NAME_LISTENERS) {
        listener(name)
      }
    })
    void this.driveCompat.openDocumentSharingModal({
      linkId: this.documentState.getProperty('entitlements').nodeMeta.linkId,
      volumeId: this.documentState.getProperty('entitlements').nodeMeta.volumeId,
      onPublicLinkToggle: (enabled) => {
        this.documentState.emitEvent({
          name: 'PublicLinkToggleStateChanged',
          payload: { enabled },
        })
      },
      registerOverriddenNameListener: (listener: (name: string) => void) => OVERRIDDEN_NAME_LISTENERS.add(listener),
    })
  }

  public openMoveToFolderModal() {
    void this.driveCompat.openMoveToFolderModal(this.documentState.getProperty('entitlements').nodeMeta)
  }

  deinit() {}
}
