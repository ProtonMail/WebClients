import { decodeAwarenessUpdate, encodeAwarenessUpdate } from '@proton-docs/realtime-sdk'
import type { AwarenessEntry, JsonValue, Participant } from '@proton-docs/realtime-sdk'

/**
 * What doc2 last fed the editor per peer id: the awareness clock, the state's JSON (null once the peer left) and the
 * `lastSeenAt` it was fed at. An id stays after it leaves, since the editor keeps its clock and takes only higher ones.
 */
export type PeerClocks = ReadonlyMap<number, { clock: number; state: string | null; lastSeenAt: number }>

/**
 * Whether `state` is a Lexical user state. Lexical's cursor sync takes any `anchorPos` and `focusPos` but null as a
 * position, and throws on undefined ones, so a state without both, such as the `{}` every y-protocols awareness holds
 * until Lexical sets its own, must never reach an editor.
 */
export function isUserState(state: JsonValue): boolean {
  return typeof state === 'object' && state !== null && 'anchorPos' in state && 'focusPos' in state
}

/**
 * The editor's own entry in an awareness update it broadcasts, which holds every entry its awareness knows: a user
 * state, or null once the editor clears it. Undefined when the update has none, or only the `{}` the editor's
 * awareness holds before Lexical sets its state. Throws on a malformed update.
 */
export function findEditorPresence(
  update: Uint8Array<ArrayBuffer>,
  editorClientId: number,
): { state: JsonValue } | undefined {
  const entry = decodeAwarenessUpdate(update).find(({ clientId }) => clientId === editorClientId)
  return entry && (entry.state === null || isUserState(entry.state)) ? { state: entry.state } : undefined
}

/**
 * The awareness update that brings the editor in step with `participants`, never self nor the editor's own id: a new
 * peer at clock 1, a peer whose state or `lastSeenAt` changed at its clock + 1, and a peer that left as null at its
 * clock + 1. The editor applies only higher clocks and expires an entry 30s after it was last fed, so the SDK's
 * keepalive, which changes only `lastSeenAt`, keeps peers shown. `update` is undefined when nothing changed.
 */
export function encodeParticipantsForEditor(
  previous: PeerClocks,
  participants: Participant[],
  editorClientId: number,
): { update: Uint8Array<ArrayBuffer> | undefined; clocks: PeerClocks } {
  const clocks = new Map(previous)
  const entries: AwarenessEntry[] = []
  const present = new Set<number>()

  for (const { id, isSelf, state, lastSeenAt } of participants) {
    // A state that isn't a user state would crash the editor, so it counts as a peer that left
    if (isSelf || id === editorClientId || !isUserState(state)) {
      continue
    }
    present.add(id)
    const json = JSON.stringify(state)
    const fed = clocks.get(id)
    if (fed?.state === json && fed.lastSeenAt === lastSeenAt) {
      continue
    }
    const clock = (fed?.clock ?? 0) + 1
    clocks.set(id, { clock, state: json, lastSeenAt })
    entries.push({ clientId: id, clock, state })
  }

  for (const [id, fed] of previous) {
    if (fed.state !== null && !present.has(id)) {
      clocks.set(id, { ...fed, clock: fed.clock + 1, state: null })
      entries.push({ clientId: id, clock: fed.clock + 1, state: null })
    }
  }

  return { update: entries.length > 0 ? encodeAwarenessUpdate(entries) : undefined, clocks }
}
