import { c } from 'ttag'
import type { SquashDocument } from '../../UseCase/SquashDocument'
import type { DuplicateDocument } from '../../UseCase/DuplicateDocument'
import type { CreateNewDocument } from '../../UseCase/CreateNewDocument'
import type { DriveCompat } from '@proton/drive-store'
import type { InternalEventBusInterface, DocsAwarenessStateChangeData, YjsState } from '@proton/docs-shared'
import { DocAwarenessEvent, getErrorString } from '@proton/docs-shared'
import { ConnectionCloseReason } from '@proton/docs-proto'
import type { DocControllerInterface } from './DocControllerInterface'
import type { SeedInitialCommit } from '../../UseCase/SeedInitialCommit'
import type { UserState } from '@lexical/yjs'
import type { GetDocumentMeta } from '../../UseCase/GetDocumentMeta'
import type { VersionHistoryUpdate } from '../../VersionHistory'
import { NativeVersionHistory } from '../../VersionHistory'
import type { DocControllerEventPayloads } from './DocControllerEvent'
import { DocControllerEvent } from './DocControllerEvent'

import type { DocsClientSquashVerificationObjectionMadePayload } from '../../Application/ApplicationEvent'
import { ApplicationEvent, PostApplicationError } from '../../Application/ApplicationEvent'
import type { SquashVerificationObjectionCallback } from '../../Types/SquashVerificationObjection'
import type { LoadCommit } from '../../UseCase/LoadCommit'
import { TranslatedResult } from '../../Domain/Result/TranslatedResult'
import { Result } from '../../Domain/Result/Result'
import { getPlatformFriendlyDateForFileName } from '../../Util/PlatformFriendlyFileNameDate'
import { DocParticipantTracker } from './DocParticipantTracker'
import { MAX_DOC_SIZE } from '../../Models/Constants'
import type { GetNode } from '../../UseCase/GetNode'
import type { DocumentState } from '../../State/DocumentState'
import type { LoggerInterface } from '@proton/utils/logs'

/**
 * Controls the lifecycle of a single document.
 */
export class DocController implements DocControllerInterface {
  isRefetchingStaleCommit = false
  isDestroyed = false
  didTrashDocInCurrentSession = false
  receivedOrSentDUs: VersionHistoryUpdate[] = []

  public userAddress = this.documentState.getProperty('entitlements').keys.userOwnAddress
  readonly participantTracker = new DocParticipantTracker(this.documentState)

  constructor(
    private readonly documentState: DocumentState,
    private driveCompat: DriveCompat,
    private _squashDocument: SquashDocument,
    readonly _createInitialCommit: SeedInitialCommit,
    readonly _loadCommit: LoadCommit,
    private _duplicateDocument: DuplicateDocument,
    private _createNewDocument: CreateNewDocument,
    readonly _getDocumentMeta: GetDocumentMeta,
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

    this.documentState.subscribeToEvent('RealtimeConnectionClosed', (payload) => {
      this.handleRealtimeDisconnection(payload)
    })

    this.documentState.subscribeToEvent('RealtimeFailedToGetToken', (payload) => {
      this.handleRealtimeFailedToGetToken(payload)
    })

    this.documentState.subscribeToEvent('RealtimeReceivedDocumentUpdate', (payload) => {
      this.receivedOrSentDUs.push(payload)
    })

    this.documentState.subscribeToEvent('RealtimeNewCommitIdReceived', (payload) => {
      this.documentState.setProperty('currentCommitId', payload)
    })

    this.documentState.subscribeToEvent('RealtimeReceivedCommentMessage', (payload) => {
      this.eventBus.publish({
        type: DocControllerEvent.RealtimeCommentMessageReceived,
        payload: <DocControllerEventPayloads[DocControllerEvent.RealtimeCommentMessageReceived]>{
          message: payload,
        },
      })
    })
  }

  handleRealtimeDisconnection(reason: ConnectionCloseReason): void {
    if (reason.props.code === ConnectionCloseReason.CODES.STALE_COMMIT_ID) {
      void this.refetchCommitDueToStaleContents('rts-disconnect')
    }
  }

  /**
   * The client was unable to get a token from the Docs API because the Commit ID the client had did not match
   * what the server was expecting.
   */
  handleRealtimeFailedToGetToken(reason: 'due-to-commit-id-out-of-sync'): void {
    if (reason === 'due-to-commit-id-out-of-sync') {
      void this.refetchCommitDueToStaleContents('token-fail')
    }
  }

  /**
   * If the RTS rejects or drops our connection due to our commit ID not being what it has, we will refetch the document
   * and its binary from the main API and update our content.
   */
  async refetchCommitDueToStaleContents(source: 'token-fail' | 'rts-disconnect') {
    if (this.isRefetchingStaleCommit) {
      this.logger.info('Attempting to refetch stale commit but refetch already in progress')
      return
    }

    this.isRefetchingStaleCommit = true

    this.logger.info('Refetching document due to stale commit ID from source', source)

    const fail = (error: string) => {
      this.isRefetchingStaleCommit = false

      this.logger.error(error)

      this.eventBus.publish({
        type: DocControllerEvent.UnableToResolveCommitIdConflict,
        payload: undefined,
      })
    }

    const nodeMeta = this.documentState.getProperty('documentMeta').nodeMeta

    const result = await this._getDocumentMeta.execute(nodeMeta)
    if (result.isFailed()) {
      fail(`Failed to reload document meta: ${result.getError()}`)

      return
    }

    const latestCommitId = result.getValue().latestCommitId()

    if (!latestCommitId || latestCommitId === this.documentState.getProperty('currentCommitId')) {
      fail(!latestCommitId ? 'Reloaded commit but commit id was null' : 'Reloaded commit id is the same as current')

      return
    }

    const entitlements = this.documentState.getProperty('entitlements')

    const decryptResult = await this._loadCommit.execute(nodeMeta, latestCommitId, entitlements.keys.documentContentKey)
    if (decryptResult.isFailed()) {
      fail(`Failed to reload or decrypt commit: ${decryptResult.getError()}`)

      return Result.fail(decryptResult.getError())
    }

    const decryptedCommit = decryptResult.getValue()

    this.logger.info(
      `Reownloaded and decrypted commit id ${decryptedCommit.commitId} with ${decryptedCommit?.numberOfUpdates()} updates`,
    )

    this.documentState.setProperty('baseCommit', decryptedCommit)
    this.documentState.setProperty('currentCommitId', decryptedCommit.commitId)

    this.isRefetchingStaleCommit = false
  }

  public getVersionHistory(): NativeVersionHistory | undefined {
    const updates = [...(this.documentState.getProperty('baseCommit')?.updates ?? []), ...this.receivedOrSentDUs]

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
    const docMeta = this.documentState.getProperty('documentMeta')
    const result = await this._getNode.execute(docMeta.nodeMeta, docMeta)
    if (result.isFailed()) {
      this.logger.error('Failed to get node', result.getError())
      return
    }

    const { node, refreshedDocMeta } = result.getValue()
    this.documentState.setProperty('decryptedNode', node)

    if (refreshedDocMeta) {
      this.documentState.setProperty('documentMeta', refreshedDocMeta)
      this.documentState.setProperty('documentName', refreshedDocMeta.name)
    }

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
      this.logger.error('Failed to seed document', result.getError())

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
    this.documentState.emitEvent({
      name: 'DebugMenuRequestingCommitWithRTS',
      payload: this.documentState.getProperty('entitlements'),
    })
  }

  public async createInitialCommit(content: Uint8Array): Promise<Result<unknown>> {
    const result = await this._createInitialCommit.execute(
      this.documentState.getProperty('documentMeta').nodeMeta,
      content,
      this.documentState.getProperty('entitlements').keys,
    )

    if (result.isFailed()) {
      this.logger.error('Failed to create initial commit', result.getError())
    } else {
      const resultValue = result.getValue()
      this.documentState.setProperty('currentCommitId', resultValue.commitId)
    }

    return result
  }

  public async squashDocument(): Promise<void> {
    const baseCommit = this.documentState.getProperty('baseCommit')
    if (!baseCommit) {
      this.logger.info('No initial commit to squash')
      return
    }

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

    this.logger.info('Squashing document')

    const result = await this._squashDocument.execute({
      docMeta: this.documentState.getProperty('documentMeta'),
      commitId: baseCommit.commitId,
      keys: this.documentState.getProperty('entitlements').keys,
      handleVerificationObjection,
    })

    if (result.isFailed()) {
      this.logger.error('Failed to squash document', result.getError())
    } else {
      this.logger.info('Squash result', result.getValue())
    }
  }

  public async duplicateDocument(editorYjsState: Uint8Array): Promise<void> {
    const result = await this._duplicateDocument.executePrivate(
      this.documentState.getProperty('documentMeta'),
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

    void this.driveCompat.openDocument(shell)
  }

  public async restoreRevisionAsCopy(yjsContent: YjsState): Promise<void> {
    const result = await this._duplicateDocument.executePrivate(
      this.documentState.getProperty('documentMeta'),
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

    void this.driveCompat.openDocument(shell)
  }

  public async createNewDocument(): Promise<void> {
    const date = getPlatformFriendlyDateForFileName()
    // translator: Default title for a new Proton Document (example: Untitled document 2024-04-23)
    const baseTitle = c('Title').t`Untitled document ${date}`
    const newName = `${baseTitle}`

    const result = await this._createNewDocument.execute(
      newName,
      this.documentState.getProperty('documentMeta').nodeMeta,
      this.documentState.getProperty('decryptedNode'),
    )

    if (result.isFailed()) {
      this.logger.error('Failed to create new document', result.getError())

      PostApplicationError(this.eventBus, {
        translatedError: c('Error').t`An error occurred while creating a new document. Please try again.`,
      })

      return
    }

    const shell = result.getValue()

    void this.driveCompat.openDocument(shell)
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
      await this.driveCompat.renameDocument(this.documentState.getProperty('documentMeta').nodeMeta, name)
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
      await this.driveCompat.trashDocument(this.documentState.getProperty('documentMeta').nodeMeta, parentLinkId)

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
      await this.driveCompat.restoreDocument(this.documentState.getProperty('documentMeta').nodeMeta, parentLinkId)

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
    void this.driveCompat.openDocumentSharingModal(this.documentState.getProperty('documentMeta').nodeMeta)
  }

  async handleAwarenessStateUpdate(states: UserState[]): Promise<void> {
    this.participantTracker.updateParticipantsFromUserStates(states)

    this.eventBus.publish<DocsAwarenessStateChangeData>({
      type: DocAwarenessEvent.AwarenessStateChange,
      payload: {
        states,
      },
    })
  }

  deinit() {}
}
