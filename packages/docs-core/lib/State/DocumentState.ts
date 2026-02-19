import type { ConnectionCloseReason, DocumentUpdate } from '@proton/docs-proto'
import { BasePropertiesState } from '@proton/docs-shared'
import type {
  DocumentRole,
  BroadcastSource,
  DecryptedMessage,
  DocTrashState,
  DocumentMetaInterface,
  RtsMessagePayload,
} from '@proton/docs-shared'
import type { DecryptedCommit } from '../Models/DecryptedCommit'
import type { DocumentEntitlements, PublicDocumentEntitlements } from '../Types/DocumentEntitlements'
import type { DecryptedNode, NodeMeta, PublicNodeMeta } from '@proton/drive-store/lib'

export type DocumentEvent =
  | {
      name: 'RealtimeConnectionClosed'
      payload: ConnectionCloseReason
    }
  | {
      name: 'RealtimeFailedToConnect'
      payload: undefined
    }
  | {
      name: 'RealtimeAttemptingToSendUpdateThatIsTooLarge'
      payload: undefined
    }
  | {
      name: 'RealtimeReceivedDocumentUpdate'
      payload: DecryptedMessage
    }
  | {
      name: 'RealtimeRequestingClientToBroadcastItsState'
      payload: undefined
    }
  | {
      name: 'RealtimeReceivedOtherClientPresenceState'
      payload: Uint8Array<ArrayBuffer>
    }
  | {
      name: 'EditorRequestsPropagationOfUpdate'
      payload: {
        message: RtsMessagePayload
        debugSource: BroadcastSource
      }
    }
  | {
      name: 'CommitInitialConversionContent'
      payload: DocumentUpdate
    }
  | {
      name: 'DriveFileConversionToDocBegan'
      payload: undefined
    }
  | {
      name: 'DriveFileConversionToDocSucceeded'
      payload: undefined
    }
  | {
      name: 'DebugMenuRequestingCommitWithRTS'
      payload: DocumentEntitlements
    }
  | {
      name: 'EditorIsReadyToBeShown'
      payload: undefined
    }
  | {
      name: 'PublicLinkToggleStateChanged'
      payload: {
        enabled: boolean
      }
    }
  | {
      name: 'ImportUpdateSuccessful'
      payload: {
        uuid: string
      }
    }

export interface DocumentStateValues {
  documentName: string
  currentCommitId: string | undefined
  userRole: DocumentRole
  documentTrashState: DocTrashState
  baseCommit: DecryptedCommit | undefined
  documentMeta: DocumentMetaInterface
  decryptedNode: DecryptedNode
  entitlements: DocumentEntitlements

  currentDocumentEmailDocTitleEnabled: boolean

  /** true when the editor is ready to receive function invocations */
  editorReady: boolean
  /**
   * true when the editor has been configured with the correct initial config, set as permissions and mode.
   * This must necessarily happen after editorReady, since first we need the editor to tell us it is ready to
   * receive invocations. Then we invoke a initialize-editor function.
   */
  editorInitialized: boolean
  editorHasRenderingIssue: boolean

  /** Public documents may not support realtime depending on feature configuration */
  realtimeEnabled: boolean
  /** Is set to true after the connection connects AND the server informs us its ready to receive updates */
  realtimeReadyToBroadcast: boolean
  /** Is set to true if we are unable to form a connection with the RTS server in a reasonable time */
  realtimeConnectionTimedOut: boolean
  realtimeStatus: 'connected' | 'connecting' | 'disconnected'
  realtimeIsExperiencingErroredSync: boolean
  realtimeIsLockedDueToSizeContraint: boolean
  realtimeIsParticipantLimitReached: boolean
  realtimeIsLockedDueToSquashError: boolean
  realtimeConnectionToken: string | undefined

  realtimeShouldBeShownInReadonlyMode: boolean
}

const DefaultValues: Pick<
  DocumentStateValues,
  | 'documentName'
  | 'currentCommitId'
  | 'baseCommit'
  | 'editorReady'
  | 'editorInitialized'
  | 'editorHasRenderingIssue'
  | 'realtimeEnabled'
  | 'realtimeReadyToBroadcast'
  | 'realtimeConnectionTimedOut'
  | 'realtimeStatus'
  | 'realtimeIsExperiencingErroredSync'
  | 'realtimeIsLockedDueToSizeContraint'
  | 'realtimeIsParticipantLimitReached'
  | 'realtimeIsLockedDueToSquashError'
  | 'realtimeShouldBeShownInReadonlyMode'
> = {
  documentName: '',
  currentCommitId: undefined,
  baseCommit: undefined,

  editorReady: false,
  editorInitialized: false,
  editorHasRenderingIssue: false,
  realtimeEnabled: true,
  realtimeConnectionTimedOut: false,
  realtimeReadyToBroadcast: false,
  realtimeStatus: 'disconnected',
  realtimeIsExperiencingErroredSync: false,
  realtimeIsLockedDueToSizeContraint: false,
  realtimeIsParticipantLimitReached: false,
  realtimeIsLockedDueToSquashError: false,
  realtimeShouldBeShownInReadonlyMode: false,
}

export function isDocumentState(state: DocumentState | PublicDocumentState): state is DocumentState {
  return state instanceof DocumentState
}

/**
 * Manages the state of a fully resolved document (has nodeMeta, documentMeta, etc)
 */
export class DocumentState extends BasePropertiesState<DocumentStateValues, DocumentEvent> {
  static readonly defaults: typeof DefaultValues = DefaultValues

  get nodeMeta(): NodeMeta {
    return this.getProperty('entitlements').nodeMeta
  }
}

/**
 * Same as DocumentState but entitlements are of type PublicDocumentEntitlements
 */
export class PublicDocumentState extends BasePropertiesState<
  Omit<DocumentStateValues, 'entitlements'> & {
    entitlements: PublicDocumentEntitlements
  },
  DocumentEvent
> {
  static readonly defaults: typeof DefaultValues = DefaultValues

  get nodeMeta(): PublicNodeMeta {
    return this.getProperty('entitlements').nodeMeta
  }
}
