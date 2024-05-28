import {
  ClientRequiresEditorMethods,
  DocChangeObserver,
  DocumentMetaInterface,
  RtsMessagePayload,
} from '@proton/docs-shared'
import { Result } from '@standardnotes/domain-core'
import { DocLoadSuccessResult } from './DocLoadSuccessResult'
import { UserState } from '@lexical/yjs'

export interface DocControllerInterface {
  username: string

  addChangeObserver(observer: DocChangeObserver): () => void
  createInitialCommit(): Promise<void>
  createNewDocument(): Promise<void>
  debugSendCommitCommandToRTS(): Promise<void>
  deinit(): void
  duplicateDocument(): Promise<void>
  editorRequestsPropagationOfUpdate(message: RtsMessagePayload, originator: string, debugSource: string): Promise<void>
  getDocumentClientId(): Promise<number>
  getSureDocument(): DocumentMetaInterface
  debugGetUnrestrictedSharingUrl(): Promise<string>
  initialize(): Promise<Result<DocLoadSuccessResult>>
  onEditorReady(): void
  renameDocument(newName: string): Promise<Result<void>>
  setEditorInvoker(editorInvoker: ClientRequiresEditorMethods): void
  squashDocument(): void
  handleAwarenessStateUpdate(states: UserState[]): Promise<void>
  acceptFailedVerificationCommit(commitId: string): Promise<void>
}
