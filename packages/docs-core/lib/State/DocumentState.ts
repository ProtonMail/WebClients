import { BasePropertiesState } from './BasePropertiesState'

import type { ConnectionCloseReason } from '@proton/docs-proto'
import type {
  BroadcastSource,
  DecryptedMessage,
  DocTrashState,
  DocumentMetaInterface,
  RtsMessagePayload,
} from '@proton/docs-shared'
import type { DocumentRole } from '@proton/docs-shared'
import type { DecryptedCommit } from '../Models/DecryptedCommit'
import type { DocumentEntitlements, PublicDocumentEntitlements } from '../Types/DocumentEntitlements'
import type { DecryptedNode } from '@proton/drive-store/lib'

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
      name: 'RealtimeFailedToGetToken'
      payload: 'due-to-commit-id-out-of-sync'
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
      name: 'RealtimeNewCommitIdReceived'
      payload: string
    }
  | {
      name: 'RealtimeReceivedCommentMessage'
      payload: Uint8Array
    }
  | {
      name: 'RealtimeReceivedOtherClientPresenceState'
      payload: Uint8Array
    }
  | {
      name: 'EditorRequestsPropagationOfUpdate'
      payload: {
        message: RtsMessagePayload
        debugSource: BroadcastSource
      }
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

export interface DocumentStateValues {
  documentName: string
  currentCommitId: string | undefined
  userRole: DocumentRole
  documentTrashState: DocTrashState
  baseCommit: DecryptedCommit | undefined
  documentMeta: DocumentMetaInterface
  decryptedNode: DecryptedNode
  entitlements: DocumentEntitlements

  editorReady: boolean
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
}

const DefaultValues: Pick<
  DocumentStateValues,
  | 'documentName'
  | 'currentCommitId'
  | 'baseCommit'
  | 'editorReady'
  | 'editorHasRenderingIssue'
  | 'realtimeEnabled'
  | 'realtimeReadyToBroadcast'
  | 'realtimeConnectionTimedOut'
  | 'realtimeStatus'
  | 'realtimeIsExperiencingErroredSync'
  | 'realtimeIsLockedDueToSizeContraint'
  | 'realtimeIsParticipantLimitReached'
> = {
  documentName: '',
  currentCommitId: undefined,
  baseCommit: undefined,

  editorReady: false,
  editorHasRenderingIssue: false,
  realtimeEnabled: true,
  realtimeConnectionTimedOut: false,
  realtimeReadyToBroadcast: false,
  realtimeStatus: 'disconnected',
  realtimeIsExperiencingErroredSync: false,
  realtimeIsLockedDueToSizeContraint: false,
  realtimeIsParticipantLimitReached: false,
}

export function isDocumentState(state: DocumentState | PublicDocumentState): state is DocumentState {
  return state instanceof DocumentState
}

/**
 * Manages the state of a fully resolved document (has nodeMeta, documentMeta, etc)
 */
export class DocumentState extends BasePropertiesState<DocumentStateValues, DocumentEvent> {
  static readonly defaults: typeof DefaultValues = DefaultValues
}

/**
 * Same as DocumentState but entitlements are of type PublicDocumentEntitlements
 */
export class PublicDocumentState extends BasePropertiesState<
  Omit<DocumentStateValues, 'entitlements'> & { entitlements: PublicDocumentEntitlements },
  DocumentEvent
> {
  static readonly defaults: typeof DefaultValues = DefaultValues
}
