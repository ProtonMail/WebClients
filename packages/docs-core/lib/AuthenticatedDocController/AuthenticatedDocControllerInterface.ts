import type { YjsState, Result, DocumentType } from '@proton/docs-shared'
import type { NativeVersionHistory } from '../VersionHistory'
import type { DocumentUpdate } from '@proton/docs-proto'

export interface AuthenticatedDocControllerInterface {
  didTrashDocInCurrentSession: boolean

  createInitialCommit(content: DocumentUpdate): Promise<Result<unknown>>
  createInitialCommitFromEditorState(state: YjsState): Promise<Result<unknown>>
  createNewDocument(documentType: DocumentType): Promise<void>
  debugSendCommitCommandToRTS(): Promise<void>
  deinit(): void
  destroy(): void
  duplicateDocument(editorYjsState: Uint8Array<ArrayBuffer>): Promise<void>
  getVersionHistory(): NativeVersionHistory | undefined
  openDocumentSharingModal(): void
  openMoveToFolderModal(): void
  restoreRevisionAsCopy(yjsContent: YjsState): Promise<void>
  restoreDocument(useSDK?: boolean): Promise<void>
  squashDocument(): Promise<void>
  squashEverythingInBaseCommit(): Promise<Result<boolean>>
  trashDocument(useSDK?: boolean): Promise<void>
  getAllUpdatesAsZip(): Promise<Blob>
  downloadAllUpdatesAsZip(): Promise<void>
  downloadUpdatesInformation(ydoc?: unknown): Promise<void>
  getUpdatesInformationAsJsonFile(ydoc?: unknown): Promise<Blob>
  downloadObfuscatedUpdates(): Promise<void>
}
