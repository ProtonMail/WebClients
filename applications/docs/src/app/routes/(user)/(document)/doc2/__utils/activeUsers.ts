import type { SafeDocsUserState } from '@proton/docs-shared/Doc/DocsAwareness'
import type { JsonValue, Participant } from '@proton-docs/realtime-sdk'

import { isUserState } from './presenceBridge'

/**
 * As docs-core's `MAX_USER_STATES_FOR_LOCKING_EDITOR`: from this many users, counted as `getActiveUsers` counts them,
 * editing is locked for all but admins
 */
export const PARTICIPANT_LIMIT = 20

export type ActiveUser = {
  id: number
  name: string
  color: string | undefined
  letter: string | undefined
  /** As in /doc, a user with awareness data who isn't focusing the editor shows faded */
  faded: boolean
  /** The participant's state, as the editor scrolls to it */
  state: SafeDocsUserState
}

/**
 * One user per `awarenessData.userId`, else name, among the participants with a user state, the session's own entry
 * first so the user's other tabs fold into it, as /doc's editor folds clients with `removeDuplicateClients` before it
 * shows or counts them. Peers' states are unverified, so every field shown is checked.
 */
export function getActiveUsers(participants: Participant[]): ActiveUser[] {
  const users = new Map<string, ActiveUser>()
  const selfFirst = [...participants].sort((a, b) => Number(b.isSelf) - Number(a.isSelf))

  for (const { id, state } of selfFirst) {
    if (!isUserState(state)) {
      continue
    }
    const { name, title, color, focusing, awarenessData } = state as Record<string, JsonValue>
    const data = isObject(awarenessData) ? awarenessData : undefined
    const shownName = asString(name) || asString(title) || '?'
    const key = asString(data?.userId) ?? shownName
    if (!users.has(key)) {
      users.set(key, {
        id,
        name: shownName,
        color: asString(color),
        letter: asString(data?.anonymousUserLetter) || undefined,
        faded: data !== undefined && focusing !== true,
        state: state as unknown as SafeDocsUserState,
      })
    }
  }

  return [...users.values()]
}

function isObject(value: JsonValue | undefined): value is Record<string, JsonValue> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function asString(value: JsonValue | undefined): string | undefined {
  return typeof value === 'string' ? value : undefined
}

/** Whether the participants make `PARTICIPANT_LIMIT` users or more */
export function isParticipantLimitReached(participants: Participant[]): boolean {
  return getActiveUsers(participants).length >= PARTICIPANT_LIMIT
}
