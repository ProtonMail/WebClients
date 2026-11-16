import type { NodeEntity } from '@proton/drive/sdk'
import type { Participant, Session, SessionSnapshot, SessionStatus } from '@proton-docs/realtime-sdk'

import type { EditorInvoker } from './EditorInvoker'
import type { DocumentRole } from './getDocumentRole'
import type { LoaderStatus, LoaderStep } from './loadDocument'
import {
  type LoadingScreenStatus,
  type LockCall,
  getLoadingScreenStatus,
  isLocked,
  isRevealPoint,
} from './loadingScreen'

const STEPS: LoaderStep[] = ['node', 'bootstrap', 'frame', 'baseState', 'catchUp', 'initialize', 'show', 'settle']
const STAGE_ORDER: LoadingScreenStatus[] = ['opening', 'decrypting', 'syncing', 'preparingEditor']
const CONNECTED: SessionStatus = { name: 'connected' }
const session = {} as Session
const editorInvoker = {} as EditorInvoker
const node = {} as NodeEntity

/** `count` users, one client each, the user's own first */
function users(count: number): Participant[] {
  return Array.from({ length: count }, (_, user) => ({
    id: user,
    isSelf: user === 0,
    state: { name: `user ${user}`, anchorPos: null, focusPos: null, awarenessData: { userId: `user-${user}` } },
    lastSeenAt: 0,
  }))
}

const snapshot = (change: Partial<SessionSnapshot> = {}) => ({
  status: CONNECTED,
  delivery: 'synced' as const,
  editing: { allowed: true as const },
  participants: users(1),
  ...change,
})

describe('getLoadingScreenStatus', () => {
  test.each<[LoaderStep, LoadingScreenStatus]>([
    ['node', 'opening'],
    ['bootstrap', 'decrypting'],
    ['frame', 'syncing'],
    ['baseState', 'syncing'],
    ['catchUp', 'syncing'],
    ['initialize', 'preparingEditor'],
    ['show', 'preparingEditor'],
    ['settle', 'preparingEditor'],
  ])('in step %s, says %s', (step, stage) => {
    expect(getLoadingScreenStatus({ name: 'loading', step })).toBe(stage)
  })

  test('never goes back a stage as the steps go on', () => {
    const stages = STEPS.map((step) => STAGE_ORDER.indexOf(getLoadingScreenStatus({ name: 'loading', step })!))

    expect(stages).toEqual([...stages].sort((a, b) => a - b))
  })

  test.each([true, false])(
    "says it can't connect for a session stopped before the reveal, retryable %s, in any step",
    (retryable) => {
      for (const step of STEPS) {
        expect(getLoadingScreenStatus({ name: 'stopped', step, retryable, session })).toBe('cantConnect')
      }
    },
  )

  test.each<[string, LoaderStatus, LoadingScreenStatus | undefined]>([
    [
      'revealed: no screen, whatever the session does next',
      { name: 'revealed', node, role: 'Editor', session, editorInvoker },
      undefined,
    ],
    ['trashed: the first stage, behind the trashed modal', { name: 'trashed', node, role: 'Admin' }, 'opening'],
  ])('%s', (_, status, screen) => {
    expect(getLoadingScreenStatus(status)).toBe(screen)
  })
})

describe('isRevealPoint', () => {
  const ready = (role: DocumentRole, change: Partial<SessionSnapshot> = {}, answered = true) => {
    const state = snapshot(change)
    const lockCall: LockCall = { locked: isLocked({ snapshot: state, role, editRefused: false }), answered }
    return {
      locked: lockCall.locked,
      revealed: isRevealPoint({ editorShown: true, editorRendered: true, lockCall, sessionStatus: state.status }),
    }
  }

  test.each<[string, DocumentRole, Partial<SessionSnapshot>, boolean]>([
    ['an editor, once the unlock is answered', 'Editor', {}, false],
    ['a viewer, once the lock is answered', 'Viewer', {}, true],
    ['an editor of a size-locked document', 'Editor', { editing: { allowed: false, reason: 'sizeLocked' } }, true],
    ['an editor at the participant limit', 'Editor', { participants: users(20) }, true],
    ['an admin at the participant limit, who keeps editing', 'Admin', { participants: users(20) }, false],
  ])('reveals %s', (_, role, change, locked) => {
    expect(ready(role, change)).toEqual({ locked, revealed: true })
  })

  test.each<DocumentRole>(['Editor', 'Viewer'])('waits for the answer to the lock call, for a %s', (role) => {
    expect(ready(role, {}, false).revealed).toBe(false)
  })

  test('waits for the editor to show the document and render it', () => {
    const lockCall = { locked: false, answered: true }

    expect(isRevealPoint({ editorShown: false, editorRendered: true, lockCall, sessionStatus: CONNECTED })).toBe(false)
    expect(isRevealPoint({ editorShown: true, editorRendered: false, lockCall, sessionStatus: CONNECTED })).toBe(false)
    expect(
      isRevealPoint({ editorShown: true, editorRendered: true, lockCall: undefined, sessionStatus: CONNECTED }),
    ).toBe(false)
  })

  test.each([true, false])(
    "doesn't reveal a stopped session, retryable %s, though the editor answered the lock the stop brought",
    (retryable) => {
      const sessionStatus: SessionStatus = { name: 'stopped', condition: 'transient', retryable }

      expect(ready('Editor', { status: sessionStatus }).locked).toBe(true)
      expect(ready('Editor', { status: sessionStatus }).revealed).toBe(false)
    },
  )

  test.each<SessionStatus>([
    { name: 'reconnecting', condition: 'transient', nextAttemptAt: 0, budgetExpiresAt: 0 },
    { name: 'paused' },
    { name: 'opening' },
  ])('reveals an editor while %j, which locks nothing', (sessionStatus) => {
    expect(ready('Editor', { status: sessionStatus })).toEqual({ locked: false, revealed: true })
  })
})
