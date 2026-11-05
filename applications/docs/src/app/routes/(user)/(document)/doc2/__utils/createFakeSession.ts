import type { Session, SessionEvents, SessionSnapshot } from '@proton-docs/realtime-sdk'

/** A session for tests: its snapshot changes and its events fire by hand, and every method is a jest mock. */
export function createFakeSession(snapshot: Partial<SessionSnapshot> = {}) {
  const listeners = new Map<string, Set<(payload: unknown) => void>>()
  const snapshotListeners = new Set<(snapshot: SessionSnapshot) => void>()
  let current: SessionSnapshot = {
    status: { name: 'ready' },
    delivery: 'synced',
    editing: { allowed: true },
    baseCommitId: 'commit-1',
    participants: [],
    ...snapshot,
  }

  const session = {
    on: jest.fn((event: string, listener: (payload: unknown) => void) => {
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
    connect: jest.fn(async () => {}),
    pause: jest.fn(async () => {}),
    resume: jest.fn(async () => {}),
    retry: jest.fn(async () => {}),
    sendUpdate: jest.fn(),
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
