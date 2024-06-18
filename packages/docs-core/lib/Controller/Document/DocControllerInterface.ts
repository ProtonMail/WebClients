import {
  BroadcastSource,
  ClientRequiresEditorMethods,
  DocChangeObserver,
  DocumentMetaInterface,
  RtsMessagePayload,
  DataTypesThatDocumentCanBeExportedAs,
  DocumentRole,
} from '@proton/docs-shared'
import { DocLoadSuccessResult } from './DocLoadSuccessResult'
import { UserState } from '@lexical/yjs'
import { NativeVersionHistory } from '../../VersionHistory'
import { TranslatedResult } from '../../Domain/Result/TranslatedResult'
import { Result } from '../../Domain/Result/Result'

export interface DocControllerInterface {
  username: string
  role: DocumentRole

  addChangeObserver(observer: DocChangeObserver): () => void
  createInitialCommit(): Promise<void>
  createNewDocument(): Promise<void>
  debugGetUnrestrictedSharingUrl(): Promise<string>
  debugSendCommitCommandToRTS(): Promise<void>
  deinit(): void
  duplicateDocument(): Promise<void>
  editorIsReadyToReceiveInvocations(editorInvoker: ClientRequiresEditorMethods): Promise<void>
  editorRequestsPropagationOfUpdate(message: RtsMessagePayload, debugSource: BroadcastSource): Promise<void>
  getDocumentClientId(): Promise<number | undefined>
  getSureDocument(): DocumentMetaInterface
  getVersionHistory(): NativeVersionHistory | undefined
  handleAwarenessStateUpdate(states: UserState[]): Promise<void>
  initialize(): Promise<Result<DocLoadSuccessResult>>
  openDocumentSharingModal(): Promise<void>
  renameDocument(newName: string): Promise<TranslatedResult<void>>
  showCommentsPanel(): void
  squashDocument(): Promise<void>
  exportAndDownload(format: DataTypesThatDocumentCanBeExportedAs): Promise<void>
  printAsPDF(): Promise<void>
}
