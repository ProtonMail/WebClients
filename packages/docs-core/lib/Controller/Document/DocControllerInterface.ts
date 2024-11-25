import type { YjsState } from '@proton/docs-shared'
import type { UserState } from '@lexical/yjs'
import type { NativeVersionHistory } from '../../VersionHistory'
import type { TranslatedResult } from '../../Domain/Result/TranslatedResult'
import type { Result } from '../../Domain/Result/Result'
import type { AnyDocControllerInterface } from './AnyDocControllerInterface'

export interface DocControllerInterface extends AnyDocControllerInterface {
  userAddress: string
  didTrashDocInCurrentSession: boolean

  createInitialCommit(content: Uint8Array): Promise<Result<unknown>>
  createNewDocument(): Promise<void>
  debugSendCommitCommandToRTS(): Promise<void>
  deinit(): void
  destroy(): void
  duplicateDocument(editorYjsState: Uint8Array): Promise<void>

  getVersionHistory(): NativeVersionHistory | undefined
  handleAwarenessStateUpdate(states: UserState[]): Promise<void>
  openDocumentSharingModal(): void
  restoreRevisionAsCopy(yjsContent: YjsState): Promise<void>
  renameDocument(newName: string): Promise<TranslatedResult<void>>
  restoreDocument(): Promise<void>
  squashDocument(): Promise<void>
  trashDocument(): Promise<void>
}
