import type {
  BroadcastSource,
  ClientRequiresEditorMethods,
  DocumentMetaInterface,
  RtsMessagePayload,
  DataTypesThatDocumentCanBeExportedAs,
  DocumentRole,
  DocTrashState,
  YjsState,
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
  editorIsRequestingToLockAfterRenderingIssue(): void
  editorRequestsPropagationOfUpdate(message: RtsMessagePayload, debugSource: BroadcastSource): Promise<void>
  exportAndDownload(format: DataTypesThatDocumentCanBeExportedAs): Promise<void>
  exportData(format: DataTypesThatDocumentCanBeExportedAs): Promise<Uint8Array>
  getDocumentClientId(): Promise<number | undefined>
  getEditorJSON(): Promise<SerializedEditorState | undefined>
  getSureDocument(): DocumentMetaInterface
  getTrashState(): DocTrashState | undefined
  getVersionHistory(): NativeVersionHistory | undefined
  handleAwarenessStateUpdate(states: UserState[]): Promise<void>
  initialize(): Promise<Result<PrivateDocLoadSuccessResult>>
  openDocumentSharingModal(): void
  printAsPDF(): Promise<void>
  renameDocument(newName: string): Promise<TranslatedResult<void>>
  restoreDocument(): Promise<void>
  restoreRevisionAsCopy(yjsContent: YjsState): Promise<void>
  restoreRevisionByReplacing(lexicalState: SerializedEditorState): Promise<void>
  showCommentsPanel(): void
  squashDocument(): Promise<void>
  toggleDebugTreeView(): Promise<void>
  trashDocument(): Promise<void>
}
