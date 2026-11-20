import type { BaseState, HistoryEntry, Session, SessionEvents, SessionSnapshot } from '@proton-docs/realtime-sdk'

/**
 * A session for tests, pending until bootstrapped: its snapshot changes and its events fire by hand, and every method is
 * a jest mock.
 */
export function createFakeSession(snapshot: Partial<SessionSnapshot> = {}) {
  const listeners = new Map<string, Set<(payload: unknown) => void>>()
  const snapshotListeners = new Set<(snapshot: SessionSnapshot) => void>()
  let current: SessionSnapshot = {
    status: { name: 'ready' },
    delivery: 'synced',
    editing: { allowed: true },
    baseCommitId: 'commit-1',
    caughtUp: false,
    participants: [],
    tokenPreferences: {},
    ...snapshot,
  }

  const session = {
    on: vi.fn((event: string, listener: (payload: unknown) => void) => {
      const eventListeners = listeners.get(event) ?? new Set()
      listeners.set(event, eventListeners.add(listener))
      return () => {
        eventListeners.delete(listener)
      }
    }),
    subscribe: (listener: (snapshot: SessionSnapshot) => void) => {
      snapshotListeners.add(listener)
      return () => {
        snapshotListeners.delete(listener)
      }
    },
    getSnapshot: () => current,
    getBaseState: vi.fn((): BaseState => ({ commitId: 'commit-1', updates: [] })),
    getHistory: vi.fn((): HistoryEntry[] => []),
    getNodeMeta: vi.fn(() => ({ volumeId: 'VOLUME', linkId: 'LINK', userOwnAddress: 'member@example.com' })),
    config: { documentType: 'doc', nodeMeta: { volumeId: 'VOLUME', linkId: 'LINK' }, clientId: 1 },
    // A pending session and the session it bootstraps into are one object, as in the SDK
    bootstrap: vi.fn(async (): Promise<Session> => session as unknown as Session),
    connect: vi.fn(async () => {}),
    disconnect: vi.fn(async () => {}),
    pause: vi.fn(async () => {}),
    resume: vi.fn(async () => {}),
    retry: vi.fn(async () => {}),
    sendUpdate: vi.fn(),
    setPresence: vi.fn(),
  }

  return {
    session: session as unknown as Session,
    mocks: session,
    listenerCount: () => [...listeners.values()].reduce((count, eventListeners) => count + eventListeners.size, 0),
    emit: <K extends keyof SessionEvents>(event: K, payload: SessionEvents[K]) =>
      listeners.get(event)?.forEach((listener) => listener(payload)),
    setSnapshot: (change: Partial<SessionSnapshot>) => {
      current = { ...current, ...change }
      snapshotListeners.forEach((listener) => listener(current))
    },
  }
}
