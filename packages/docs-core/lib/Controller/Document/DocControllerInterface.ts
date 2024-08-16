import type {
  BroadcastSource,
  ClientRequiresEditorMethods,
  DocumentMetaInterface,
  RtsMessagePayload,
  DataTypesThatDocumentCanBeExportedAs,
  DocumentRole,
} from '@proton/docs-shared'
import type { DocLoadSuccessResult } from './DocLoadSuccessResult'
import type { UserState } from '@lexical/yjs'
import type { NativeVersionHistory } from '../../VersionHistory'
import type { TranslatedResult } from '../../Domain/Result/TranslatedResult'
import type { Result } from '../../Domain/Result/Result'
import type { SerializedEditorState } from 'lexical'

export interface DocControllerInterface {
  userAddress?: string
  role: DocumentRole

  createInitialCommit(): Promise<Result<unknown>>
  createNewDocument(): Promise<void>
  debugGetUnrestrictedSharingUrl(): Promise<string>
  debugSendCommitCommandToRTS(): Promise<void>
  deinit(): void
  destroy(): void
  duplicateDocument(): Promise<void>
  editorIsReadyToReceiveInvocations(editorInvoker: ClientRequiresEditorMethods): Promise<void>
  editorRequestsPropagationOfUpdate(message: RtsMessagePayload, debugSource: BroadcastSource): Promise<void>
  editorIsRequestingToLockAfterRenderingIssue(): void
  exportAndDownload(format: DataTypesThatDocumentCanBeExportedAs): Promise<void>
  getDocumentClientId(): Promise<number | undefined>
  getEditorJSON(): Promise<SerializedEditorState | undefined>
  getSureDocument(): DocumentMetaInterface
  getVersionHistory(): NativeVersionHistory | undefined
  handleAwarenessStateUpdate(states: UserState[]): Promise<void>
  initialize(): Promise<Result<DocLoadSuccessResult>>
  openDocumentSharingModal(): void
  printAsPDF(): Promise<void>
  renameDocument(newName: string): Promise<TranslatedResult<void>>
  showCommentsPanel(): void
  squashDocument(): Promise<void>
}
