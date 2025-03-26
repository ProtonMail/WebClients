import type { YjsState } from '@proton/docs-shared'
import type { NativeVersionHistory } from '../VersionHistory'
import type { TranslatedResult } from '@proton/docs-shared'
import type { Result } from '@proton/docs-shared'

export interface AuthenticatedDocControllerInterface {
  didTrashDocInCurrentSession: boolean

  createInitialCommit(content: Uint8Array): Promise<Result<unknown>>
  createNewDocument(): Promise<void>
  debugSendCommitCommandToRTS(): Promise<void>
  deinit(): void
  destroy(): void
  duplicateDocument(editorYjsState: Uint8Array): Promise<void>
  getVersionHistory(): NativeVersionHistory | undefined
  openDocumentSharingModal(): void
  openMoveToFolderModal(): void
  restoreRevisionAsCopy(yjsContent: YjsState): Promise<void>
  renameDocument(newName: string): Promise<TranslatedResult<void>>
  restoreDocument(): Promise<void>
  squashDocument(): Promise<void>
  trashDocument(): Promise<void>
}
