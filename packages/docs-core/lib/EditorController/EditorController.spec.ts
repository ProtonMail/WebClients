import { EditorController } from './EditorController'
import type { Logger } from '@proton/utils/logs'
import { DocumentRole } from '@proton/docs-shared'
import type { ConnectionCloseReason } from '@proton/docs-proto'
import { EventType, EventTypeEnum } from '@proton/docs-proto'
import metrics from '@proton/metrics'
import type { DocumentStateValues } from '../State/DocumentState'
import { DocumentState } from '../State/DocumentState'
import type { ClientRequiresEditorMethods, DecryptedMessage, InternalEventBusInterface } from '@proton/docs-shared'
import type { SerializedEditorState } from 'lexical'
import type { DecryptedCommit } from '../Models/DecryptedCommit'
import { LoadLogger } from '../LoadLogger/LoadLogger'

jest.mock('@proton/metrics', () => ({
  docs_readonly_mode_documents_total: {
    increment: jest.fn(),
  },
}))

describe('EditorController', () => {
  let controller: EditorController
  let logger: Logger
  let exportAndDownload: any
  let sharedState: DocumentState
  let editorInvoker: jest.Mocked<ClientRequiresEditorMethods>
  let eventBus: InternalEventBusInterface

  beforeEach(() => {
    jest.spyOn(LoadLogger, 'logEventRelativeToLoadTime').mockImplementation(jest.fn())

    logger = {
      info: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
    } as unknown as Logger

    exportAndDownload = {
      execute: jest.fn(),
    }

    sharedState = new DocumentState({
      ...DocumentState.defaults,
      userRole: new DocumentRole('Editor'),
    } as DocumentStateValues)

    editorInvoker = {
      receiveMessage: jest.fn(),
      showEditor: jest.fn(),
      performOpeningCeremony: jest.fn(),
      performClosingCeremony: jest.fn(),
      changeLockedState: jest.fn(),
      broadcastPresenceState: jest.fn(),
      toggleDebugTreeView: jest.fn(),
      printAsPDF: jest.fn(),
      getCurrentEditorState: jest.fn(),
      showCommentsPanel: jest.fn(),
      exportData: jest.fn(),
      getDocumentState: jest.fn(),
      getClientId: jest.fn(),
      replaceEditorState: jest.fn(),
    } as unknown as jest.Mocked<ClientRequiresEditorMethods>

    eventBus = {} as InternalEventBusInterface

    controller = new EditorController(logger, exportAndDownload, sharedState, eventBus)
  })

  describe('receiveEditor', () => {
    it('should initialize editor invoker and set editor ready state', () => {
      controller.receiveEditor(editorInvoker)
      expect(sharedState.getProperty('editorReady')).toBe(true)
      expect(logger.info).toHaveBeenCalledWith('Editor is ready to receive invocations')
    })
  })

  describe('showEditorForTheFirstTime', () => {
    beforeEach(() => {
      controller.receiveEditor(editorInvoker)
    })

    it('should throw error if editor invoker is not initialized', () => {
      const controller = new EditorController(logger, exportAndDownload, sharedState, eventBus)
      expect(() => controller.showEditorForTheFirstTime()).toThrow('Editor invoker not initialized')
    })

    it('should show editor when realtime is disabled', () => {
      sharedState.setProperty('realtimeEnabled', false)
      sharedState.setProperty('realtimeReadyToBroadcast', false)
      sharedState.setProperty('realtimeConnectionTimedOut', false)

      controller.showEditorForTheFirstTime()

      expect(editorInvoker.showEditor).toHaveBeenCalled()
    })

    it('should show editor when realtime is ready to broadcast', () => {
      sharedState.setProperty('realtimeEnabled', true)
      sharedState.setProperty('realtimeReadyToBroadcast', true)
      sharedState.setProperty('realtimeConnectionTimedOut', false)

      controller.showEditorForTheFirstTime()

      expect(editorInvoker.showEditor).toHaveBeenCalled()
    })

    it('should show editor when realtime connection has timed out', () => {
      sharedState.setProperty('realtimeEnabled', true)
      sharedState.setProperty('realtimeReadyToBroadcast', false)
      sharedState.setProperty('realtimeConnectionTimedOut', true)

      controller.showEditorForTheFirstTime()

      expect(editorInvoker.showEditor).toHaveBeenCalled()
    })

    it('should not show editor when realtime is enabled but not ready and not timed out', () => {
      sharedState.setProperty('realtimeEnabled', true)
      sharedState.setProperty('realtimeReadyToBroadcast', false)
      sharedState.setProperty('realtimeConnectionTimedOut', false)

      controller.showEditorForTheFirstTime()

      expect(editorInvoker.showEditor).not.toHaveBeenCalled()
    })

    it('should emit EditorIsReadyToBeShown event when editor is shown', () => {
      sharedState.setProperty('realtimeEnabled', false)
      sharedState.setProperty('realtimeReadyToBroadcast', false)
      sharedState.setProperty('realtimeConnectionTimedOut', false)
      sharedState.emitEvent = jest.fn()

      controller.showEditorForTheFirstTime()

      expect(sharedState.emitEvent).toHaveBeenCalledWith({
        name: 'EditorIsReadyToBeShown',
        payload: undefined,
      })
    })

    it('should reload editing locked state when editor is shown', () => {
      sharedState.setProperty('realtimeEnabled', true)
      sharedState.setProperty('realtimeReadyToBroadcast', true)

      controller.reloadEditingLockedState = jest.fn()

      controller.showEditorForTheFirstTime()

      expect(controller.reloadEditingLockedState).toHaveBeenCalled()
    })
  })

  describe('reloadEditingLockedState', () => {
    beforeEach(() => {
      controller.receiveEditor(editorInvoker)
    })

    it('should do nothing if editor invoker is not initialized', () => {
      const controller = new EditorController(logger, exportAndDownload, sharedState, eventBus)
      controller.reloadEditingLockedState()
      expect(editorInvoker.changeLockedState).not.toHaveBeenCalled()
    })

    it('should lock editor when participant limit is reached and user is not admin', () => {
      sharedState.setProperty('realtimeIsParticipantLimitReached', true)
      sharedState.setProperty('userRole', new DocumentRole('Editor'))

      controller.reloadEditingLockedState()

      expect(editorInvoker.changeLockedState).toHaveBeenCalledWith(true)
      expect(metrics.docs_readonly_mode_documents_total.increment).toHaveBeenCalledWith({
        reason: 'user_limit_reached',
      })
    })

    it('should lock editor when user lacks edit permissions', () => {
      sharedState.setProperty('userRole', new DocumentRole('Viewer'))

      controller.reloadEditingLockedState()

      expect(editorInvoker.changeLockedState).toHaveBeenCalledWith(true)
      expect(metrics.docs_readonly_mode_documents_total.increment).toHaveBeenCalledWith({
        reason: 'no_editing_permissions',
      })
    })

    it('should lock editor when experiencing errored sync', () => {
      sharedState.setProperty('userRole', new DocumentRole('Editor'))
      sharedState.setProperty('realtimeIsExperiencingErroredSync', true)

      controller.reloadEditingLockedState()

      expect(editorInvoker.changeLockedState).toHaveBeenCalledWith(true)
      expect(metrics.docs_readonly_mode_documents_total.increment).toHaveBeenCalledWith({
        reason: 'errored_sync',
      })
    })

    it('should lock editor when size constraint is reached', () => {
      sharedState.setProperty('userRole', new DocumentRole('Editor'))
      sharedState.setProperty('realtimeIsLockedDueToSizeContraint', true)

      controller.reloadEditingLockedState()

      expect(editorInvoker.changeLockedState).toHaveBeenCalledWith(true)
      expect(metrics.docs_readonly_mode_documents_total.increment).toHaveBeenCalledWith({
        reason: 'size_limit',
      })
    })

    it('should lock editor when not connected', () => {
      sharedState.setProperty('userRole', new DocumentRole('Editor'))
      sharedState.setProperty('realtimeStatus', 'disconnected')

      controller.reloadEditingLockedState()

      expect(editorInvoker.changeLockedState).toHaveBeenCalledWith(true)
      expect(metrics.docs_readonly_mode_documents_total.increment).toHaveBeenCalledWith({
        reason: 'not_connected',
      })
    })

    it('should unlock editor when all conditions are met', () => {
      sharedState.setProperty('userRole', new DocumentRole('Editor'))
      sharedState.setProperty('realtimeStatus', 'connected')
      sharedState.setProperty('documentTrashState', 'not_trashed')
      sharedState.setProperty('editorHasRenderingIssue', false)
      sharedState.setProperty('realtimeIsLockedDueToSizeContraint', false)
      sharedState.setProperty('realtimeIsExperiencingErroredSync', false)

      controller.reloadEditingLockedState()

      expect(editorInvoker.changeLockedState).toHaveBeenCalledWith(false)
    })

    it('should lock editor when document is in trash', () => {
      sharedState.setProperty('realtimeStatus', 'connected')
      controller.receiveEditor(editorInvoker)
      sharedState.setProperty('userRole', new DocumentRole('Editor'))
      sharedState.setProperty('documentTrashState', 'trashed')

      controller.reloadEditingLockedState()

      expect(logger.info).toHaveBeenCalledWith('Locking editor due to trash state')
      expect(editorInvoker.changeLockedState).toHaveBeenCalledWith(true)
      expect(metrics.docs_readonly_mode_documents_total.increment).toHaveBeenCalled()
    })

    it('should not lock editor when document is not in trash', () => {
      controller.receiveEditor(editorInvoker)
      sharedState.setProperty('userRole', new DocumentRole('Editor'))
      sharedState.setProperty('documentTrashState', 'not_trashed')
      sharedState.setProperty('realtimeStatus', 'connected')

      controller.reloadEditingLockedState()

      expect(logger.info).toHaveBeenCalledWith('Unlocking editor')
      expect(editorInvoker.changeLockedState).toHaveBeenCalledWith(false)
    })
  })

  describe('event handling', () => {
    beforeEach(() => {
      controller.receiveEditor(editorInvoker)
    })

    it('should handle realtime document updates', () => {
      const payload = { content: new Uint8Array([1, 2, 3]) } as DecryptedMessage
      sharedState.emitEvent({
        name: 'RealtimeReceivedDocumentUpdate',
        payload,
      })

      expect(editorInvoker.receiveMessage).toHaveBeenCalledWith({
        type: { wrapper: 'du' },
        content: payload.content,
      })
    })

    it('should handle client presence state', () => {
      const payload = new Uint8Array([1, 2, 3])
      sharedState.emitEvent({
        name: 'RealtimeReceivedOtherClientPresenceState',
        payload,
      })

      expect(editorInvoker.receiveMessage).toHaveBeenCalledWith({
        type: {
          wrapper: 'events',
          eventType: EventType.create(EventTypeEnum.ClientIsBroadcastingItsPresenceState).value,
        },
        content: payload,
      })
    })

    it('should handle connection closed', () => {
      sharedState.emitEvent({
        name: 'RealtimeConnectionClosed',
        payload: {} as ConnectionCloseReason,
      })

      expect(editorInvoker.performClosingCeremony).toHaveBeenCalled()
    })
  })

  describe('export and document operations', () => {
    beforeEach(() => {
      controller.receiveEditor(editorInvoker)
    })

    it('should export and download document', async () => {
      const format = 'docx'
      const documentName = 'test.docx'
      const data = new Uint8Array([1, 2, 3])

      editorInvoker.exportData.mockResolvedValue(data)
      sharedState.setProperty('documentName', documentName)

      await controller.exportAndDownload(format)

      expect(editorInvoker.exportData).toHaveBeenCalledWith(format)
      expect(exportAndDownload.execute).toHaveBeenCalledWith(data, documentName, format)
    })

    it('should throw when exporting without editor invoker', async () => {
      const controller = new EditorController(logger, exportAndDownload, sharedState, eventBus)
      await expect(controller.exportAndDownload('docx')).rejects.toThrow()
    })

    it('should restore revision by replacing', async () => {
      const lexicalState = { root: {} } as SerializedEditorState
      await controller.restoreRevisionByReplacing(lexicalState)
      expect(editorInvoker.replaceEditorState).toHaveBeenCalledWith(lexicalState)
    })

    it('should get document client id', async () => {
      const clientId = 123
      editorInvoker.getClientId.mockResolvedValue(clientId)

      const result = await controller.getDocumentClientId()
      expect(result).toBe(clientId)
    })
  })

  describe('subscription handlers', () => {
    beforeEach(() => {
      controller.receiveEditor(editorInvoker)
    })

    it('should show editor when realtimeReadyToBroadcast becomes true', () => {
      sharedState.setProperty('realtimeReadyToBroadcast', true)
      expect(editorInvoker.showEditor).toHaveBeenCalled()
    })

    it('should send base commit to editor when baseCommit changes', async () => {
      const mockContent = new Uint8Array([1, 2, 3])
      sharedState.setProperty('baseCommit', {
        squashedRepresentation: () => mockContent,
      } as unknown as DecryptedCommit)

      // sendBaseCommitToEditor is an async method, so we need to wait for it to complete
      await new Promise(process.nextTick)

      expect(editorInvoker.receiveMessage).toHaveBeenCalledWith({
        type: { wrapper: 'du' },
        content: mockContent,
        origin: 'InitialLoad',
      })
    })

    it('should broadcast presence state when requested', () => {
      sharedState.emitEvent({
        name: 'RealtimeRequestingClientToBroadcastItsState',
        payload: undefined,
      })
      expect(editorInvoker.broadcastPresenceState).toHaveBeenCalled()
    })
  })

  describe('sendBaseCommitToEditor', () => {
    it('should do nothing if baseCommit is not set', async () => {
      sharedState.setProperty('baseCommit', undefined)
      await controller.sendBaseCommitToEditor()
      expect(editorInvoker.receiveMessage).not.toHaveBeenCalled()
    })
  })

  describe('additional editor state methods', () => {
    beforeEach(() => {
      controller.receiveEditor(editorInvoker)
    })

    it('should handle broadcastPresenceState', () => {
      controller.broadcastPresenceState()
      expect(editorInvoker.broadcastPresenceState).toHaveBeenCalled()
    })

    it('should throw when calling broadcastPresenceState without editor', () => {
      const controller = new EditorController(logger, exportAndDownload, sharedState, eventBus)
      expect(() => controller.broadcastPresenceState()).toThrow('Editor invoker not initialized')
    })

    it('should handle getEditorJSON', async () => {
      const mockState = { root: {} } as SerializedEditorState
      editorInvoker.getCurrentEditorState.mockResolvedValue(mockState)

      const result = await controller.getEditorJSON()
      expect(result).toEqual(mockState)
      expect(editorInvoker.getCurrentEditorState).toHaveBeenCalled()
    })

    it('should handle getDocumentState', async () => {
      const mockState = new Uint8Array([1, 2, 3])
      editorInvoker.getDocumentState.mockResolvedValue(mockState)

      const result = await controller.getDocumentState()
      expect(result).toEqual(mockState)
    })
  })

  describe('reloadEditingLockedState additional cases', () => {
    beforeEach(() => {
      controller.receiveEditor(editorInvoker)
    })

    it('should lock editor when editor has rendering issue', () => {
      sharedState.setProperty('userRole', new DocumentRole('Editor'))
      sharedState.setProperty('editorHasRenderingIssue', true)

      controller.reloadEditingLockedState()

      expect(editorInvoker.changeLockedState).toHaveBeenCalledWith(true)
    })

    it('should lock editor when document is trashed', () => {
      sharedState.setProperty('userRole', new DocumentRole('Editor'))
      sharedState.setProperty('documentTrashState', 'trashed')

      controller.reloadEditingLockedState()

      expect(editorInvoker.changeLockedState).toHaveBeenCalledWith(true)
    })
  })

  describe('metrics', () => {
    beforeEach(() => {
      controller.receiveEditor(editorInvoker)
    })

    it('should increment metrics with unknown reason when no specific condition is met', () => {
      sharedState.setProperty('userRole', new DocumentRole('Editor'))
      sharedState.setProperty('realtimeStatus', 'connected')

      controller.incrementMetricsReadonlyState()

      expect(metrics.docs_readonly_mode_documents_total.increment).toHaveBeenCalledWith({
        reason: 'unknown',
      })
    })

    it('should increment metrics with not_connected reason', () => {
      sharedState.setProperty('userRole', new DocumentRole('Editor'))
      sharedState.setProperty('realtimeStatus', 'disconnected')

      controller.incrementMetricsReadonlyState()

      expect(metrics.docs_readonly_mode_documents_total.increment).toHaveBeenCalledWith({
        reason: 'not_connected',
      })
    })
  })

  describe('showCommentsPanel', () => {
    it('should do nothing if editor is not initialized', () => {
      const controller = new EditorController(logger, exportAndDownload, sharedState, eventBus)
      controller.showCommentsPanel()
      expect(editorInvoker.showCommentsPanel).not.toHaveBeenCalled()
    })

    it('should show comments panel when editor is initialized', () => {
      controller.receiveEditor(editorInvoker)
      controller.showCommentsPanel()
      expect(editorInvoker.showCommentsPanel).toHaveBeenCalled()
    })
  })

  describe('toggleDebugTreeView', () => {
    it('should throw error when editor is not initialized', async () => {
      await expect(controller.toggleDebugTreeView()).rejects.toThrow('Editor invoker not initialized')
    })

    it('should call editor toggleDebugTreeView when initialized', async () => {
      controller.receiveEditor(editorInvoker)
      await controller.toggleDebugTreeView()
      expect(editorInvoker.toggleDebugTreeView).toHaveBeenCalled()
    })
  })

  describe('printAsPDF', () => {
    it('should throw error when editor is not initialized', async () => {
      await expect(controller.printAsPDF()).rejects.toThrow('Editor invoker not initialized')
    })

    it('should call editor printAsPDF when initialized', async () => {
      controller.receiveEditor(editorInvoker)
      await controller.printAsPDF()
      expect(editorInvoker.printAsPDF).toHaveBeenCalled()
    })
  })

  describe('changeLockedState', () => {
    it('should throw error when editor is not initialized', () => {
      expect(() => controller.changeLockedState(true)).toThrow('Editor invoker not initialized')
    })

    it('should call editor changeLockedState when initialized', () => {
      controller.receiveEditor(editorInvoker)
      controller.changeLockedState(true)
      expect(editorInvoker.changeLockedState).toHaveBeenCalledWith(true)
    })
  })

  describe('performClosingCeremony', () => {
    it('should throw error when editor is not initialized', () => {
      expect(() => controller.performClosingCeremony()).toThrow('Editor invoker not initialized')
    })

    it('should call editor performClosingCeremony when initialized', () => {
      controller.receiveEditor(editorInvoker)
      controller.performClosingCeremony()
      expect(editorInvoker.performClosingCeremony).toHaveBeenCalled()
    })
  })

  describe('event handling edge cases', () => {
    it('should handle RealtimeReceivedDocumentUpdate when editor is not initialized', () => {
      const payload = { content: new Uint8Array([1, 2, 3]) } as DecryptedMessage
      sharedState.emitEvent({
        name: 'RealtimeReceivedDocumentUpdate',
        payload,
      })
      expect(editorInvoker.receiveMessage).not.toHaveBeenCalled()
    })

    it('should handle RealtimeConnectionClosed when editor is not initialized', () => {
      sharedState.emitEvent({
        name: 'RealtimeConnectionClosed',
        payload: {} as ConnectionCloseReason,
      })
      expect(editorInvoker.performClosingCeremony).not.toHaveBeenCalled()
    })

    it('should handle RealtimeReceivedOtherClientPresenceState when editor is not initialized', () => {
      const payload = new Uint8Array([1, 2, 3])
      sharedState.emitEvent({
        name: 'RealtimeReceivedOtherClientPresenceState',
        payload,
      })
      expect(editorInvoker.receiveMessage).not.toHaveBeenCalled()
    })
  })

  describe('metrics edge cases', () => {
    it('should increment metrics with size_limit reason', () => {
      sharedState.setProperty('userRole', new DocumentRole('Editor'))
      sharedState.setProperty('realtimeIsLockedDueToSizeContraint', true)

      controller.incrementMetricsReadonlyState()

      expect(metrics.docs_readonly_mode_documents_total.increment).toHaveBeenCalledWith({
        reason: 'size_limit',
      })
    })

    it('should increment metrics with errored_sync reason', () => {
      sharedState.setProperty('userRole', new DocumentRole('Editor'))
      sharedState.setProperty('realtimeIsExperiencingErroredSync', true)

      controller.incrementMetricsReadonlyState()

      expect(metrics.docs_readonly_mode_documents_total.increment).toHaveBeenCalledWith({
        reason: 'errored_sync',
      })
    })

    it('should increment metrics with user_limit_reached reason', () => {
      sharedState.setProperty('realtimeIsParticipantLimitReached', true)

      controller.incrementMetricsReadonlyState()

      expect(metrics.docs_readonly_mode_documents_total.increment).toHaveBeenCalledWith({
        reason: 'user_limit_reached',
      })
    })
  })

  describe('document state operations', () => {
    it('should throw when getting document state without editor', async () => {
      await expect(controller.getDocumentState()).rejects.toThrow(
        'Attempting to get document state before editor invoker is initialized',
      )
    })

    it('should return undefined for client id when editor is not initialized', async () => {
      const result = await controller.getDocumentClientId()
      expect(result).toBeUndefined()
    })

    it('should throw when restoring revision without editor', async () => {
      const lexicalState = { root: {} } as SerializedEditorState
      await expect(controller.restoreRevisionByReplacing(lexicalState)).rejects.toThrow(
        'Attempting to restore revision by replacing before editor invoker is initialized',
      )
    })
  })

  describe('editor ready state', () => {
    it('should emit EditorIsReadyToBeShown event when showing editor', () => {
      const emitEventSpy = jest.spyOn(sharedState, 'emitEvent')
      controller.receiveEditor(editorInvoker)
      sharedState.setProperty('realtimeEnabled', true)
      sharedState.setProperty('realtimeReadyToBroadcast', true)

      controller.showEditorForTheFirstTime()

      expect(emitEventSpy).toHaveBeenCalledWith({
        name: 'EditorIsReadyToBeShown',
        payload: undefined,
      })
    })

    it('should log info when showing editor', () => {
      controller.receiveEditor(editorInvoker)
      sharedState.setProperty('realtimeEnabled', true)
      sharedState.setProperty('realtimeReadyToBroadcast', true)

      controller.showEditorForTheFirstTime()

      expect(logger.info).toHaveBeenCalledWith('Showing editor for the first time')
    })
  })

  describe('getEditorJSON', () => {
    it('should throw error when editor is not initialized', async () => {
      await expect(controller.getEditorJSON()).rejects.toThrow('Editor invoker not initialized')
    })

    it('should return editor state when initialized', async () => {
      const mockState: SerializedEditorState = {
        root: {
          children: [],
          direction: null,
          format: '',
          indent: 0,
          type: 'root',
          version: 1,
        },
      }

      controller.receiveEditor(editorInvoker)
      editorInvoker.getCurrentEditorState.mockResolvedValue(mockState)

      const result = await controller.getEditorJSON()

      expect(result).toEqual(mockState)
      expect(editorInvoker.getCurrentEditorState).toHaveBeenCalled()
    })
  })

  describe('exportData', () => {
    it('should throw error when editor is not initialized', async () => {
      await expect(controller.exportData('docx')).rejects.toThrow(
        'Attepting to export document before editor invoker or decrypted node is initialized',
      )
    })

    it('should return exported data when initialized', async () => {
      const mockExportedData = new Uint8Array([1, 2, 3, 4])
      controller.receiveEditor(editorInvoker)
      editorInvoker.exportData.mockResolvedValue(mockExportedData)

      const result = await controller.exportData('docx')

      expect(result).toEqual(mockExportedData)
      expect(editorInvoker.exportData).toHaveBeenCalledWith('docx')
    })
  })

  describe('RealtimeRequestingClientToBroadcastItsState event', () => {
    it('should not broadcast presence state when editor is not initialized', () => {
      sharedState.emitEvent({
        name: 'RealtimeRequestingClientToBroadcastItsState',
        payload: undefined,
      })

      expect(editorInvoker.broadcastPresenceState).not.toHaveBeenCalled()
    })

    it('should broadcast presence state when editor is initialized', () => {
      controller.receiveEditor(editorInvoker)

      sharedState.emitEvent({
        name: 'RealtimeRequestingClientToBroadcastItsState',
        payload: undefined,
      })

      expect(editorInvoker.broadcastPresenceState).toHaveBeenCalled()
    })
  })

  describe('opening ceremony', () => {
    beforeEach(() => {
      controller.receiveEditor(editorInvoker)
    })

    it('should perform opening ceremony when realtimeReadyToBroadcast becomes true and editor is initialized', () => {
      sharedState.setProperty('editorInitialized', true)
      sharedState.setProperty('realtimeReadyToBroadcast', true)

      expect(logger.info).toHaveBeenCalledWith('Performing opening ceremony after realtimeReadyToBroadcast')
      expect(editorInvoker.performOpeningCeremony).toHaveBeenCalled()
    })

    it('should perform opening ceremony when editor becomes initialized and realtime is ready', () => {
      sharedState.setProperty('realtimeReadyToBroadcast', true)
      sharedState.setProperty('editorInitialized', true)

      expect(logger.info).toHaveBeenCalledWith('Performing opening ceremony after editorInitialized')
      expect(editorInvoker.performOpeningCeremony).toHaveBeenCalled()
    })

    it('should not perform opening ceremony when realtimeReadyToBroadcast is true but editor is not initialized', () => {
      sharedState.setProperty('editorInitialized', false)
      sharedState.setProperty('realtimeReadyToBroadcast', true)

      expect(editorInvoker.performOpeningCeremony).not.toHaveBeenCalled()
    })

    it('should not perform opening ceremony when editor is initialized but realtime is not ready', () => {
      sharedState.setProperty('editorInitialized', true)
      sharedState.setProperty('realtimeReadyToBroadcast', false)

      expect(editorInvoker.performOpeningCeremony).not.toHaveBeenCalled()
    })

    it('should not perform opening ceremony when editor invoker is not set', () => {
      controller.editorInvoker = undefined

      sharedState.setProperty('editorInitialized', true)
      sharedState.setProperty('realtimeReadyToBroadcast', true)

      expect(editorInvoker.performOpeningCeremony).not.toHaveBeenCalled()
    })
  })
})
