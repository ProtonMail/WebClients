import {
  BroadcastSources,
  ClientRequiresEditorMethods,
  DocChangeObserver,
  DocumentMetaInterface,
  RtsMessagePayload,
} from '@proton/docs-shared'
import { Result } from '@standardnotes/domain-core'
import { DocLoadSuccessResult } from './DocLoadSuccessResult'
import { UserState } from '@lexical/yjs'
import { NativeVersionHistory } from '../../VersionHistory'

export interface DocControllerInterface {
  username: string

  addChangeObserver(observer: DocChangeObserver): () => void
  createInitialCommit(): Promise<void>
  createNewDocument(): Promise<void>
  debugGetUnrestrictedSharingUrl(): Promise<string>
  debugSendCommitCommandToRTS(): Promise<void>
  deinit(): void
  duplicateDocument(): Promise<void>
  editorRequestsPropagationOfUpdate(
    message: RtsMessagePayload,
    originator: string,
    debugSource: BroadcastSources,
  ): Promise<void>
  getDocumentClientId(): Promise<number | undefined>
  getSureDocument(): DocumentMetaInterface
  getVersionHistory(): NativeVersionHistory | undefined
  handleAwarenessStateUpdate(states: UserState[]): Promise<void>
  initialize(): Promise<Result<DocLoadSuccessResult>>
  openDocumentSharingModal(): Promise<void>
  renameDocument(newName: string): Promise<Result<void>>
  setEditorInvoker(editorInvoker: ClientRequiresEditorMethods): void
  showCommentsPanel(): void
  squashDocument(): Promise<void>
}
