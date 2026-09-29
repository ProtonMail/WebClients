import type { YjsState, Result, DocumentType, NodeMeta } from '@proton/docs-shared'
import type { NativeVersionHistory } from '../VersionHistory'
import type { DocumentUpdate } from '@proton/docs-proto'

export interface AuthenticatedDocControllerInterface {
  didTrashDocInCurrentSession: boolean

  createInitialCommit(content: DocumentUpdate): Promise<Result<unknown>>
  createInitialCommitFromEditorState(state: YjsState): Promise<Result<unknown>>
  createNewDocument(documentType: DocumentType): Promise<NodeMeta>
  debugSendCommitCommandToRTS(): Promise<void>
  deinit(): void
  destroy(): void
  duplicateDocument(
    editorYjsState: Uint8Array<ArrayBuffer>,
  ): Promise<{ nodeMeta: NodeMeta; documentType: DocumentType }>
  getVersionHistory(): NativeVersionHistory | undefined
  openDocumentSharingModal(): void
  openMoveToFolderModal(): void
  restoreRevisionAsCopy(yjsContent: YjsState): Promise<{ nodeMeta: NodeMeta; documentType: DocumentType }>
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
