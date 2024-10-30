import type { SerializedEditorState } from 'lexical'
import type { DocumentMetaInterface, DocumentRole } from '@proton/docs-shared'
import type {
  ClientRequiresEditorMethods,
  DataTypesThatDocumentCanBeExportedAs,
  EditorEvent,
  EditorEventData,
} from '@proton/docs-shared'

export interface AnyDocControllerInterface {
  destroy(): void
  get role(): DocumentRole
  editorIsReadyToReceiveInvocations(editorInvoker: ClientRequiresEditorMethods): Promise<void>
  editorReportingEvent(event: EditorEvent, data: EditorEventData[EditorEvent]): Promise<void>
  getDocumentClientId(): Promise<number | undefined>
  exportData(format: DataTypesThatDocumentCanBeExportedAs): Promise<Uint8Array>
  exportAndDownload(format: DataTypesThatDocumentCanBeExportedAs): Promise<void>
  printAsPDF(): Promise<void>
  getEditorJSON(): Promise<SerializedEditorState | undefined>
  toggleDebugTreeView(): Promise<void>
  getSureDocument(): DocumentMetaInterface
}
