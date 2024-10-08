import type {
  BroadcastSource,
  ClientRequiresEditorMethods,
  DocumentMetaInterface,
  RtsMessagePayload,
  DataTypesThatDocumentCanBeExportedAs,
  DocumentRole,
  DocTrashState,
} from '@proton/docs-shared'
import type { PrivateDocLoadSuccessResult } from './DocLoadSuccessResult'
import type { UserState } from '@lexical/yjs'
import type { NativeVersionHistory } from '../../VersionHistory'
import type { TranslatedResult } from '../../Domain/Result/TranslatedResult'
import type { Result } from '../../Domain/Result/Result'
import type { SerializedEditorState } from 'lexical'
import type { AnyDocControllerInterface } from './AnyDocControllerInterface'

export interface DocControllerInterface extends AnyDocControllerInterface {
  userAddress?: string
  role: DocumentRole
  didTrashDocInCurrentSession: boolean

  createInitialCommit(): Promise<Result<unknown>>
  createNewDocument(): Promise<void>
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
  getTrashState(): DocTrashState | undefined
  handleAwarenessStateUpdate(states: UserState[]): Promise<void>
  initialize(): Promise<Result<PrivateDocLoadSuccessResult>>
  openDocumentSharingModal(): void
  printAsPDF(): Promise<void>
  renameDocument(newName: string): Promise<TranslatedResult<void>>
  trashDocument(): Promise<void>
  restoreDocument(): Promise<void>
  showCommentsPanel(): void
  squashDocument(): Promise<void>
  toggleDebugTreeView(): Promise<void>
}
