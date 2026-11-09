import { decodeAwarenessUpdate, encodeAwarenessUpdate } from '@proton-docs/realtime-sdk'
import type { Participant } from '@proton-docs/realtime-sdk'

import { type PeerClocks, encodeParticipantsForEditor, findEditorPresence } from './presenceBridge'

const EDITOR_ID = 7
const SELF_ID = 100
const ALICE = { name: 'Alice', color: '#f00', anchorPos: null, focusPos: null, awarenessData: { userId: 'alice' } }
const BOB = { name: 'Bob', color: '#00f', anchorPos: null, focusPos: null, awarenessData: { userId: 'bob' } }

function participant(id: number, state: Participant['state'], lastSeenAt = 1_000, isSelf = false): Participant {
  return { id, isSelf, state, lastSeenAt }
}

describe('findEditorPresence', () => {
  test("takes the editor's own entry out of an update that holds every entry its awareness knows", () => {
    const update = encodeAwarenessUpdate([
      { clientId: 3, clock: 4, state: BOB },
      { clientId: EDITOR_ID, clock: 2, state: ALICE },
    ])

    expect(findEditorPresence(update, EDITOR_ID)).toEqual({ state: ALICE })
  })

  test('takes a cleared own entry as null', () => {
    const update = encodeAwarenessUpdate([{ clientId: EDITOR_ID, clock: 9, state: null }])

    expect(findEditorPresence(update, EDITOR_ID)).toEqual({ state: null })
  })

  test("finds nothing while the editor's entry is still y-protocols' initial {}, before Lexical sets its state", () => {
    const update = encodeAwarenessUpdate([{ clientId: EDITOR_ID, clock: 1, state: {} }])

    expect(findEditorPresence(update, EDITOR_ID)).toBeUndefined()
  })

  test("finds nothing in an update without the editor's entry", () => {
    const update = encodeAwarenessUpdate([{ clientId: 3, clock: 4, state: BOB }])

    expect(findEditorPresence(update, EDITOR_ID)).toBeUndefined()
  })

  test('throws on a malformed update', () => {
    expect(() => findEditorPresence(new Uint8Array([5]), EDITOR_ID)).toThrow('Malformed awareness update')
  })
})

describe('encodeParticipantsForEditor', () => {
  test('sends each new peer at clock 1, and nothing for self or the editor itself', () => {
    const { update, clocks } = encodeParticipantsForEditor(
      new Map(),
      [participant(SELF_ID, ALICE, 1_000, true), participant(EDITOR_ID, ALICE), participant(3, BOB)],
      EDITOR_ID,
    )

    expect(decodeAwarenessUpdate(update!)).toEqual([{ clientId: 3, clock: 1, state: BOB }])
    expect([...clocks.keys()]).toEqual([3])
  })

  test("never sends a peer whose state has no cursor fields, which would crash the editor's cursor sync", () => {
    const { update } = encodeParticipantsForEditor(
      new Map(),
      [participant(3, {}), participant(4, { name: 'Carol' }), participant(5, 'not a state'), participant(6, BOB)],
      EDITOR_ID,
    )

    expect(decodeAwarenessUpdate(update!)).toEqual([{ clientId: 6, clock: 1, state: BOB }])
  })

  test('sends a peer whose state loses its cursor fields as null, as one that left', () => {
    const joined = encodeParticipantsForEditor(new Map(), [participant(3, BOB)], EDITOR_ID)

    const { update } = encodeParticipantsForEditor(joined.clocks, [participant(3, {})], EDITOR_ID)

    expect(decodeAwarenessUpdate(update!)).toEqual([{ clientId: 3, clock: 2, state: null }])
  })

  test('sends nothing when no peer changed', () => {
    const first = encodeParticipantsForEditor(new Map(), [participant(3, BOB)], EDITOR_ID)

    const second = encodeParticipantsForEditor(first.clocks, [participant(3, { ...BOB })], EDITOR_ID)

    expect(second.update).toBeUndefined()
    expect(second.clocks).toEqual(first.clocks)
  })

  test("sends a peer again at clock + 1 when its state changes, and leaves the other peers' clocks", () => {
    const first = encodeParticipantsForEditor(new Map(), [participant(3, BOB), participant(4, ALICE)], EDITOR_ID)
    const moved = { ...BOB, anchorPos: 'cursor-moved' }

    const { update } = encodeParticipantsForEditor(
      first.clocks,
      [participant(3, moved), participant(4, ALICE)],
      EDITOR_ID,
    )

    expect(decodeAwarenessUpdate(update!)).toEqual([{ clientId: 3, clock: 2, state: moved }])
  })

  test("sends a peer again at clock + 1 on a keepalive, which changes only its lastSeenAt, so the editor doesn't expire it", () => {
    const first = encodeParticipantsForEditor(new Map(), [participant(3, BOB, 1_000)], EDITOR_ID)

    const { update } = encodeParticipantsForEditor(first.clocks, [participant(3, BOB, 16_000)], EDITOR_ID)

    expect(decodeAwarenessUpdate(update!)).toEqual([{ clientId: 3, clock: 2, state: BOB }])
  })

  test('sends a peer that leaves once, as null at clock + 1', () => {
    const joined = encodeParticipantsForEditor(new Map(), [participant(3, BOB), participant(4, ALICE)], EDITOR_ID)

    const left = encodeParticipantsForEditor(joined.clocks, [participant(4, ALICE)], EDITOR_ID)
    const stillGone = encodeParticipantsForEditor(left.clocks, [participant(4, ALICE)], EDITOR_ID)

    expect(decodeAwarenessUpdate(left.update!)).toEqual([{ clientId: 3, clock: 2, state: null }])
    expect(stillGone.update).toBeUndefined()
  })

  test('sends every peer as null when the snapshot drops to self, as on a lost connection', () => {
    const joined = encodeParticipantsForEditor(new Map(), [participant(3, BOB), participant(4, ALICE)], EDITOR_ID)

    const { update } = encodeParticipantsForEditor(joined.clocks, [participant(SELF_ID, ALICE, 1_000, true)], EDITOR_ID)

    expect(decodeAwarenessUpdate(update!)).toEqual([
      { clientId: 3, clock: 2, state: null },
      { clientId: 4, clock: 2, state: null },
    ])
  })

  test('sends a peer that rejoins above the clock of its null, which the editor still holds', () => {
    const joined = encodeParticipantsForEditor(new Map(), [participant(3, BOB)], EDITOR_ID)
    const left = encodeParticipantsForEditor(joined.clocks, [], EDITOR_ID)

    const { update } = encodeParticipantsForEditor(left.clocks, [participant(3, BOB)], EDITOR_ID)

    expect(decodeAwarenessUpdate(update!)).toEqual([{ clientId: 3, clock: 3, state: BOB }])
  })

  test('leaves the clocks it was given unchanged', () => {
    const clocks: PeerClocks = new Map([[3, { clock: 1, state: JSON.stringify(BOB), lastSeenAt: 1_000 }]])

    encodeParticipantsForEditor(clocks, [participant(3, ALICE)], EDITOR_ID)

    expect(clocks.get(3)?.clock).toBe(1)
  })
})
