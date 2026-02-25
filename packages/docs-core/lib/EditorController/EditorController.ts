import type { LoggerInterface } from '@proton/utils/logs'
import type {
  EditorInitializationConfig,
  FileMenuAction,
  InternalEventBusInterface,
  SheetImportData,
} from '@proton/docs-shared'
import {
  DocUpdateOrigin,
  FileMenuActionEvent,
  InternalEventPublishStrategy,
  type ClientRequiresEditorMethods,
  type DataTypesThatDocumentCanBeExportedAs,
} from '@proton/docs-shared'
import type { SerializedEditorState } from 'lexical'
import type { DocumentState, DocumentStateValues, PublicDocumentState } from '../State/DocumentState'
import metrics from '@proton/metrics'
import type { HttpsProtonMeDocsReadonlyModeDocumentsTotalV1SchemaJson } from '@proton/metrics/types/docs_readonly_mode_documents_total_v1.schema'
import { EventTypeEnum, EventType } from '@proton/docs-proto'
import { LoadLogger } from '../LoadLogger/LoadLogger'
import { PostApplicationError } from '../Application/ApplicationEvent'
import { c } from 'ttag'
import { downloadExport } from '../UseCase/ExportAndDownload'

export interface EditorControllerInterface {
  copyCurrentSelection(format: DataTypesThatDocumentCanBeExportedAs): Promise<void>
  exportAndDownload(format: DataTypesThatDocumentCanBeExportedAs): Promise<void>
  exportData(format: DataTypesThatDocumentCanBeExportedAs): Promise<Uint8Array<ArrayBuffer>>
  getDocumentClientId(): Promise<number | undefined>
  getDocumentState(): Promise<Uint8Array<ArrayBuffer>>
  getEditorJSON(): Promise<SerializedEditorState | undefined>
  getLocalSpreadsheetStateJSON(): Promise<unknown>
  getYDocAsJSON(): Promise<unknown>
  printAsPDF(): Promise<void>
  receiveEditor(editorInvoker: ClientRequiresEditorMethods): void
  restoreRevisionByReplacingLexicalState(lexicalState: SerializedEditorState): Promise<void>
  restoreRevisionByReplacingSpreadsheetState(spreadsheetState: unknown): Promise<void>
  replaceLocalSpreadsheetState(spreadsheetState: unknown, broadcastPatches: boolean): Promise<void>
  showCommentsPanel(): void
  toggleDebugTreeView(): Promise<void>
  initializeEditor(
    editorInitializationConfig: EditorInitializationConfig | undefined,
    userAddress: string,
    isPublicMode: boolean,
    appVersion: string,
  ): void
  importDataIntoSheet(data: SheetImportData): Promise<void>
  handleFileMenuAction(action: FileMenuAction): Promise<void>
  focusSpreadsheet(): void
  applyUpdate(update: Uint8Array<ArrayBuffer>): Promise<void>
}

/** Allows the UI to invoke methods on the editor. */
export class EditorController implements EditorControllerInterface {
  editorInvoker?: ClientRequiresEditorMethods

  constructor(
    private readonly logger: LoggerInterface,
    private readonly documentState: DocumentState | PublicDocumentState,
    private eventBus: InternalEventBusInterface,
  ) {
    documentState.subscribeToProperty('realtimeReadyToBroadcast', (value) => {
      if (this.editorInvoker && value) {
        this.showEditorForTheFirstTime()

        const editorInitialized = this.documentState.getProperty('editorInitialized')
        if (editorInitialized) {
          this.logger.info('Performing opening ceremony after realtimeReadyToBroadcast')
          void this.editorInvoker.performOpeningCeremony()
        }
      }
    })

    documentState.subscribeToProperty('editorInitialized', (value) => {
      const realtimeReadyToBroadcast = this.documentState.getProperty('realtimeReadyToBroadcast')
      if (this.editorInvoker && value && realtimeReadyToBroadcast) {
        this.logger.info('Performing opening ceremony after editorInitialized')
        void this.editorInvoker.performOpeningCeremony()
      }
    })

    documentState.subscribeToProperty('realtimeConnectionTimedOut', (value) => {
      if (this.editorInvoker && value) {
        this.showEditorForTheFirstTime()
      }
    })
    documentState.subscribeToProperty('realtimeShouldBeShownInReadonlyMode', (value) => {
      if (this.editorInvoker && value) {
        this.showEditorForTheFirstTime()
      }
    })

    documentState.subscribeToProperty('baseCommit', (_value) => {
      this.sendBaseCommitToEditor().catch(console.error)
    })

    this.documentState.subscribeToEvent('RealtimeReceivedOtherClientPresenceState', (payload) => {
      if (this.editorInvoker) {
        void this.editorInvoker.receiveMessage({
          type: {
            wrapper: 'events',
            eventType: EventType.create(EventTypeEnum.ClientIsBroadcastingItsPresenceState).value,
          },
          content: payload,
        })
      }
    })

    this.documentState.subscribeToEvent('RealtimeRequestingClientToBroadcastItsState', () => {
      if (this.editorInvoker) {
        void this.editorInvoker.broadcastPresenceState()
      }
    })

    this.documentState.subscribeToEvent('RealtimeConnectionClosed', () => {
      if (this.editorInvoker) {
        this.logger.info('Changing editing allowance to false after RTS disconnect')

        void this.editorInvoker.performClosingCeremony()
      }
    })

    const propertiesToObserve: (keyof DocumentStateValues)[] = [
      'documentTrashState',
      'editorHasRenderingIssue',
      'realtimeIsExperiencingErroredSync',
      'realtimeIsLockedDueToSizeContraint',
      'realtimeIsParticipantLimitReached',
      'realtimeIsLockedDueToSquashError',
      'realtimeStatus',
      'userRole',
    ]

    propertiesToObserve.forEach((property) => {
      documentState.subscribeToProperty(property, () => {
        this.reloadEditingLockedState()
      })
    })

    this.documentState.subscribeToEvent('RealtimeReceivedDocumentUpdate', (payload) => {
      void this.editorInvoker?.receiveMessage({
        type: { wrapper: 'du' },
        content: payload.content,
      })
    })

    this.documentState.subscribeToEvent('ImportUpdateSuccessful', (payload) => {
      void this.editorInvoker?.markImportUpdateAsSuccessful(payload.uuid)
    })
  }

  async sendBaseCommitToEditor() {
    const baseCommit = this.documentState.getProperty('baseCommit')
    if (!baseCommit) {
      return
    }

    try {
      const squashedContent = await baseCommit.squashedRepresentation()
      this.logger.info('Sending base commit to editor')
      void this.editorInvoker?.receiveMessage({
        type: { wrapper: 'du' },
        content: squashedContent,
        origin: DocUpdateOrigin.InitialLoad,
      })
    } catch (error) {
      if (error instanceof Error) {
        this.logger.error(error)
      }
      PostApplicationError(this.eventBus, {
        translatedError: c('Error')
          .t`There was an error processing updates to the document. Please reload the page and try again.`,
      })
      this.documentState.setProperty('editorHasRenderingIssue', true)
    }
  }

  initializeEditor(
    editorInitializationConfig: EditorInitializationConfig | undefined,
    userAddress: string,
    isPublicMode: boolean,
    appVersion: string,
  ): void {
    if (!this.editorInvoker) {
      throw new Error('Editor invoker not initialized')
    }

    const docMeta = this.documentState.getProperty('documentMeta')

    void this.editorInvoker.initializeEditor(
      docMeta.uniqueIdentifier,
      userAddress,
      this.documentState.getProperty('userRole').roleType,
      isPublicMode,
      appVersion,
      editorInitializationConfig,
    )

    this.documentState.setProperty('editorInitialized', true)
  }

  receiveEditor(editorInvoker: ClientRequiresEditorMethods): void {
    this.editorInvoker = editorInvoker

    this.logger.info('Editor is ready to receive invocations')

    this.documentState.setProperty('editorReady', true)

    void this.sendBaseCommitToEditor()

    this.showEditorForTheFirstTime()
  }

  showEditorForTheFirstTime(): void {
    if (!this.editorInvoker) {
      throw new Error('Editor invoker not initialized')
    }

    const realtimeEnabled = this.documentState.getProperty('realtimeEnabled')
    const realtimeReadyToBroadcast = this.documentState.getProperty('realtimeReadyToBroadcast')
    const realtimeConnectionTimedOut = this.documentState.getProperty('realtimeConnectionTimedOut')
    const realtimeShouldBeShownInReadonlyMode = this.documentState.getProperty('realtimeShouldBeShownInReadonlyMode')
    const realtimeIsDoneLoading =
      realtimeReadyToBroadcast || realtimeConnectionTimedOut || realtimeShouldBeShownInReadonlyMode

    if (realtimeEnabled && !realtimeIsDoneLoading) {
      this.logger.info('Not showing editor for the first time due to RTS status', {
        realtimeEnabled,
        realtimeReadyToBroadcast,
        realtimeConnectionTimedOut,
        realtimeShouldBeShownInReadonlyMode,
      })
      return
    }

    this.logger.info('Showing editor for the first time')

    void this.editorInvoker.showEditor()

    LoadLogger.logEventRelativeToLoadTime('Editor shown for first time')

    this.documentState.emitEvent({
      name: 'EditorIsReadyToBeShown',
      payload: undefined,
    })

    this.reloadEditingLockedState()
  }

  changeLockedState(shouldLock: boolean): void {
    if (!this.editorInvoker) {
      throw new Error('Editor invoker not initialized')
    }

    void this.editorInvoker.changeLockedState(shouldLock)
  }

  performClosingCeremony(): void {
    if (!this.editorInvoker) {
      throw new Error('Editor invoker not initialized')
    }

    void this.editorInvoker.performClosingCeremony()
  }

  broadcastPresenceState(): void {
    if (!this.editorInvoker) {
      throw new Error('Editor invoker not initialized')
    }

    void this.editorInvoker.broadcastPresenceState()
  }

  async toggleDebugTreeView(): Promise<void> {
    if (!this.editorInvoker) {
      throw new Error('Editor invoker not initialized')
    }

    void this.editorInvoker.toggleDebugTreeView()
  }

  async printAsPDF(): Promise<void> {
    if (!this.editorInvoker) {
      throw new Error('Editor invoker not initialized')
    }

    void this.editorInvoker.printAsPDF()
  }

  async getEditorJSON(): Promise<SerializedEditorState | undefined> {
    if (!this.editorInvoker) {
      throw new Error('Editor invoker not initialized')
    }

    const json = await this.editorInvoker.getCurrentEditorState()
    return json
  }

  async getLocalSpreadsheetStateJSON(): Promise<unknown> {
    if (!this.editorInvoker) {
      throw new Error('Editor invoker not initialized')
    }

    const json = await this.editorInvoker.getLocalSpreadsheetStateJSON()
    return json
  }

  async getYDocAsJSON(): Promise<unknown> {
    if (!this.editorInvoker) {
      throw new Error('Editor invoker not initialized')
    }

    const json = await this.editorInvoker.getYDocAsJSON()
    return json
  }

  showCommentsPanel(): void {
    if (!this.editorInvoker) {
      return
    }

    void this.editorInvoker.showCommentsPanel()
  }

  async exportData(format: DataTypesThatDocumentCanBeExportedAs): Promise<Uint8Array<ArrayBuffer>> {
    if (!this.editorInvoker) {
      throw new Error(`Attepting to export document before editor invoker or decrypted node is initialized`)
    }

    return this.editorInvoker.exportData(format)
  }

  async copyCurrentSelection(format: DataTypesThatDocumentCanBeExportedAs): Promise<void> {
    if (!this.editorInvoker) {
      throw new Error(`Attepting to export document before editor invoker or decrypted node is initialized`)
    }

    return this.editorInvoker.copyCurrentSelection(format)
  }

  async getDocumentState(): Promise<Uint8Array<ArrayBuffer>> {
    if (!this.editorInvoker) {
      throw new Error('Attempting to get document state before editor invoker is initialized')
    }

    return this.editorInvoker.getDocumentState()
  }

  async exportAndDownload(format: DataTypesThatDocumentCanBeExportedAs): Promise<void> {
    if (!this.editorInvoker) {
      throw new Error(`Attepting to export document before editor invoker or decrypted node is initialized`)
    }

    const data = await this.exportData(format)

    downloadExport(data, this.documentState.getProperty('documentName'), format)
  }

  public async getDocumentClientId(): Promise<number | undefined> {
    if (this.editorInvoker) {
      return this.editorInvoker.getClientId()
    }

    return undefined
  }

  public async restoreRevisionByReplacingLexicalState(lexicalState: SerializedEditorState): Promise<void> {
    if (!this.editorInvoker) {
      throw new Error('Attempting to restore revision by replacing before editor invoker is initialized')
    }

    await this.editorInvoker.replaceEditorState(lexicalState)
  }

  async restoreRevisionByReplacingSpreadsheetState(spreadsheetState: object): Promise<void> {
    if (!this.editorInvoker) {
      throw new Error(
        'Attempting to restore revision by replacing spreadsheet state before editor invoker is initialized',
      )
    }

    await this.editorInvoker.replaceLocalSpreadsheetState(spreadsheetState, true)
  }

  async replaceLocalSpreadsheetState(spreadsheetState: object, broadcastPatches: boolean): Promise<void> {
    if (!this.editorInvoker) {
      throw new Error('Attempting to replace local spreadsheet state before editor invoker is initialized')
    }

    await this.editorInvoker.replaceLocalSpreadsheetState(spreadsheetState, broadcastPatches)
  }

  reloadEditingLockedState(): void {
    if (!this.editorInvoker) {
      return
    }

    const role = this.documentState.getProperty('userRole')

    let shouldLock = true

    if (this.documentState.getProperty('realtimeIsParticipantLimitReached') && !role.isAdminOrOwner()) {
      this.logger.info('Max users. Changing editing locked to true')
    } else if (!role.canEdit()) {
      this.logger.info('Locking editor due to lack of editing permissions')
    } else if (this.documentState.getProperty('realtimeIsExperiencingErroredSync')) {
      this.logger.info('Locking editor due to errored sync')
    } else if (this.documentState.getProperty('realtimeIsLockedDueToSizeContraint')) {
      this.logger.info('Locking editor due to size constraint')
    } else if (this.documentState.getProperty('editorHasRenderingIssue')) {
      this.logger.info('Locking editor due to editor rendering issue')
    } else if (this.documentState.getProperty('realtimeIsLockedDueToSquashError')) {
      this.logger.info('Locking editor due to squash error')
    } else if (this.documentState.getProperty('realtimeStatus') !== 'connected') {
      this.logger.info('Locking editor due to websocket status', this.documentState.getProperty('realtimeStatus'))
    } else if (this.documentState.getProperty('documentTrashState') === 'trashed') {
      this.logger.info('Locking editor due to trash state')
    } else {
      this.logger.info('Unlocking editor')
      shouldLock = false
    }

    void this.editorInvoker.changeLockedState(shouldLock)
    if (shouldLock) {
      this.incrementMetricsReadonlyState()
    }
  }

  incrementMetricsReadonlyState(): void {
    let reason: HttpsProtonMeDocsReadonlyModeDocumentsTotalV1SchemaJson['Labels']['reason'] = 'unknown'

    if (this.documentState.getProperty('realtimeIsParticipantLimitReached')) {
      reason = 'user_limit_reached'
    } else if (!this.documentState.getProperty('userRole').canEdit()) {
      reason = 'no_editing_permissions'
    } else if (this.documentState.getProperty('realtimeIsExperiencingErroredSync')) {
      reason = 'errored_sync'
    } else if (this.documentState.getProperty('realtimeIsLockedDueToSizeContraint')) {
      reason = 'size_limit'
    } else if (this.documentState.getProperty('realtimeStatus') !== 'connected') {
      reason = 'not_connected'
    }

    metrics.docs_readonly_mode_documents_total.increment({
      reason: reason,
    })
  }

  async importDataIntoSheet(data: SheetImportData): Promise<void> {
    if (!this.editorInvoker) {
      throw new Error('Attempting to import data into sheet before editor invoker is initialized')
    }

    await this.editorInvoker.importDataIntoSheet(data)
  }

  focusSpreadsheet(): void {
    if (!this.editorInvoker) {
      throw new Error('Attempting to focus spreadsheet before editor invoker is initialized')
    }

    void this.editorInvoker.focusSpreadsheet()
  }

  async handleFileMenuAction(action: FileMenuAction): Promise<void> {
    if (!this.editorInvoker) {
      throw new Error('Attempting to handle file menu action before editor invoker is initialized')
    }

    return this.eventBus.publishSync(
      {
        type: FileMenuActionEvent,
        payload: action,
      },
      InternalEventPublishStrategy.SEQUENCE,
    )
  }

  async applyUpdate(update: Uint8Array<ArrayBuffer>): Promise<void> {
    if (!this.editorInvoker) {
      throw new Error('Attempting to apply update before editor invoker is initialized')
    }

    await this.editorInvoker.receiveMessage({
      type: { wrapper: 'du' },
      content: update,
    })
  }
}
