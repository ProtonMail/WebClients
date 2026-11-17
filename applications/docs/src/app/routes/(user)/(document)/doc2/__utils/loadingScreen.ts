import type { SessionSnapshot, SessionStatus } from '@proton-docs/realtime-sdk'

import { isParticipantLimitReached } from './activeUsers'
import type { DocumentRole } from './getDocumentRole'
import type { LoaderStatus, LoaderStep } from './loadDocument'

/** What the Loading Screen says the load is waiting for */
export type LoadingStage = 'opening' | 'decrypting' | 'syncing' | 'preparingEditor'

export type LoadingScreenStatus = LoadingStage | 'cantConnect' | 'creating' | 'redirecting'

/** The stage of each Loader step: steps never go back, so neither does the stage */
export const LOADING_STAGES: Record<LoaderStep, LoadingStage> = {
  node: 'opening',
  bootstrap: 'decrypting',
  frame: 'syncing',
  baseState: 'syncing',
  catchUp: 'syncing',
  initialize: 'preparingEditor',
  show: 'preparingEditor',
  settle: 'preparingEditor',
}

/**
 * What the Loading Screen says for the Loader's status, or undefined once revealed: it never comes back. A trashed
 * document stays at its first stage, behind the trashed modal; a failed one shows an error page instead.
 */
export function getLoadingScreenStatus(status: LoaderStatus): LoadingScreenStatus | undefined {
  switch (status.name) {
    case 'loading':
      return LOADING_STAGES[status.step]
    case 'stopped':
      return 'cantConnect'
    case 'revealed':
      return undefined
    default:
      return LOADING_STAGES.node
  }
}

/**
 * Every reason doc2 locks the editor; any one locks it. Neither a lost connection nor undelivered work is one: the
 * editor stays editable while paused or reconnecting, since the SDK's outbox carries the edits (ADR-0012).
 */
export function getLockCauses({
  snapshot,
  role,
  editRefused,
}: {
  snapshot: Pick<SessionSnapshot, 'status' | 'delivery' | 'editing' | 'participants'>
  role: DocumentRole
  editRefused: boolean
}) {
  return {
    stopped: snapshot.status.name === 'stopped',
    deliveryFailed: snapshot.delivery === 'failed',
    // sizeLocked, incompleteBaseState, and noBaseState or stopped, which the causes above cover too
    editingNotAllowed: !snapshot.editing.allowed,
    // The SDK refused an edit, so later ones would build on content the server lacks
    editRefused,
    viewer: role === 'Viewer',
    // As /doc's EditorController: admins keep editing at the limit
    participantLimitReached: isParticipantLimitReached(snapshot.participants) && role !== 'Admin',
  }
}

export function isLocked(state: Parameters<typeof getLockCauses>[0]): boolean {
  return Object.values(getLockCauses(state)).some(Boolean)
}

/** doc2's latest lock call to the editor, and whether the editor answered it */
export type LockCall = { locked: boolean; answered: boolean }

/**
 * The Reveal Point, when the Loading Screen lifts: the editor shows the document, has rendered it (its first
 * `updateFrameSize`), and answered the latest lock call, a lock or an unlock, with the session not stopped. For an
 * editor that is `docs-load:editor-editable`; a viewer, a size-locked document or one at the participant limit gets
 * a lock. The one line to change to lift the screen earlier, such as at the editor shown and rendered, an option
 * the realtime SDK's doc2 Loader spec weighs under "Reveal earlier" and that is not built.
 */
export function isRevealPoint({
  editorShown,
  editorRendered,
  lockCall,
  sessionStatus,
}: {
  editorShown: boolean
  editorRendered: boolean
  lockCall: LockCall | undefined
  sessionStatus: SessionStatus
}): boolean {
  return editorShown && editorRendered && lockCall?.answered === true && sessionStatus.name !== 'stopped'
}
