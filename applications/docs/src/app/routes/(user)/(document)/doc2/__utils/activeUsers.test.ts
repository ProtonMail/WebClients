import type { Participant } from '@proton-docs/realtime-sdk'

import { isParticipantLimitReached } from './activeUsers'

/** A participant with the user state of user `user`, the user's own when `id` is 0 */
const participant = (id: number, user: number): Participant => ({
  id,
  isSelf: id === 0,
  state: { name: `user ${user}`, anchorPos: null, focusPos: null, awarenessData: { userId: `user-${user}` } },
  lastSeenAt: 0,
})

/** `count` users, one client each, the user's own first */
const users = (count: number) => Array.from({ length: count }, (_, user) => participant(user, user))

describe('isParticipantLimitReached', () => {
  test.each([
    [19, false],
    [20, true],
    [21, true],
  ])('%i users: %s', (count, reached) => {
    expect(isParticipantLimitReached(users(count))).toBe(reached)
  })

  // As /doc's editor folds clients with removeDuplicateClients before DocParticipantTracker counts them
  test("counts users, not clients: other tabs of a user and peers without a user state don't count", () => {
    const extraClients: Participant[] = [
      participant(100, 0),
      participant(101, 5),
      participant(102, 5),
      { id: 103, isSelf: false, state: {}, lastSeenAt: 0 },
    ]

    expect(isParticipantLimitReached([...users(19), ...extraClients])).toBe(false)
    expect(isParticipantLimitReached([...users(20), ...extraClients])).toBe(true)
  })
})
