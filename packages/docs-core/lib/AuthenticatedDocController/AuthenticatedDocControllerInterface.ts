import type { YjsState, TranslatedResult, Result } from '@proton/docs-shared'
import type { NativeVersionHistory } from '../VersionHistory'
import type { DocumentType } from '@proton/drive-store/store/_documents'
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
  renameDocument(newName: string): Promise<TranslatedResult<void>>
  restoreDocument(): Promise<void>
  squashDocument(): Promise<void>
  squashEverythingInBaseCommit(): Promise<Result<boolean>>
  trashDocument(): Promise<void>
  downloadAllUpdatesAsZip(): Promise<void>
  downloadUpdatesInformation(): Promise<void>
  downloadObfuscatedUpdates(): Promise<void>
}
