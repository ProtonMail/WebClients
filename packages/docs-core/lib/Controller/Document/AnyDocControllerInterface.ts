import type { SerializedEditorState } from 'lexical'
import type { DocumentMetaInterface, DocumentRole } from 'packages/docs-shared'
import { type ClientRequiresEditorMethods, type DataTypesThatDocumentCanBeExportedAs } from '@proton/docs-shared'

export interface AnyDocControllerInterface {
  destroy(): void
  get role(): DocumentRole
  editorIsReadyToReceiveInvocations(editorInvoker: ClientRequiresEditorMethods): Promise<void>
  getDocumentClientId(): Promise<number | undefined>
  exportAndDownload(format: DataTypesThatDocumentCanBeExportedAs): Promise<void>
  printAsPDF(): Promise<void>
  getEditorJSON(): Promise<SerializedEditorState | undefined>
  toggleDebugTreeView(): Promise<void>
  getSureDocument(): DocumentMetaInterface
}
