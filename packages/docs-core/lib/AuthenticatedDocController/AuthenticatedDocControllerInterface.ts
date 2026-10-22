import type { DocumentType, NodeMeta } from '@proton/docs-shared/BasicTypes'
import type { Result } from '@proton/docs-shared/Result'
import type { YjsState } from '@proton/docs-shared/YjsState'
import type { NativeVersionHistory } from '../VersionHistory/NativeVersionHistory'
import type { DocumentUpdate } from '@proton/docs-proto/Generated/DocumentUpdate'

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
  openMoveToFolderModal(): void
  restoreRevisionAsCopy(yjsContent: YjsState): Promise<{ nodeMeta: NodeMeta; documentType: DocumentType }>
  restoreDocument(replaceDriveCompat?: boolean): Promise<void>
  squashDocument(): Promise<void>
  squashEverythingInBaseCommit(): Promise<Result<boolean>>
  trashDocument(replaceDriveCompat?: boolean): Promise<void>
  getAllUpdatesAsZip(): Promise<Blob>
  downloadAllUpdatesAsZip(): Promise<void>
  downloadUpdatesInformation(ydoc?: unknown): Promise<void>
  getUpdatesInformationAsJsonFile(ydoc?: unknown): Promise<Blob>
  downloadObfuscatedUpdates(): Promise<void>
}
