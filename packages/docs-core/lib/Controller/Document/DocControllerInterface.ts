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

  getVersionHistory(): NativeVersionHistory | undefined
  addChangeObserver(observer: DocChangeObserver): () => void
  createInitialCommit(): Promise<void>
  createNewDocument(): Promise<void>
  debugSendCommitCommandToRTS(): Promise<void>
  deinit(): void
  duplicateDocument(): Promise<void>
  editorRequestsPropagationOfUpdate(
    message: RtsMessagePayload,
    originator: string,
    debugSource: BroadcastSources,
  ): Promise<void>
  getDocumentClientId(): Promise<number>
  getSureDocument(): DocumentMetaInterface
  debugGetUnrestrictedSharingUrl(): Promise<string>
  initialize(): Promise<Result<DocLoadSuccessResult>>
  onEditorReady(): void
  renameDocument(newName: string): Promise<Result<void>>
  openDocumentSharingModal(): Promise<void>
  setEditorInvoker(editorInvoker: ClientRequiresEditorMethods): void
  squashDocument(): void
  handleAwarenessStateUpdate(states: UserState[]): Promise<void>
  acceptFailedVerificationCommit(commitId: string): Promise<void>
  showCommentsPanel(): void
}
