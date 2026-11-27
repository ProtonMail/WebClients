import type {
  BaseState,
  CommentThread,
  CommentsEvents,
  CommentsSnapshot,
  HistoryEntry,
  PublicSession,
  Session,
  SessionEvents,
  SessionSnapshot,
} from '@proton-docs/realtime-sdk'

/**
 * A session for tests, pending until bootstrapped: its snapshot changes and its events fire by hand, and every method is
 * a mock. Its `comments` are on, with no threads, whatever the config asked. With `publicLink`, it stands in for a public
 * session: see `createFakePublicSession`.
 */
export function createFakeSession(
  snapshot: Partial<SessionSnapshot> = {},
  options: { publicLink?: { userOwnAddress?: string } } = {},
) {
  const comments = createFakeComments()
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
    // A public session's getNodeMeta is the private shape: the SDK reads the volume from the document's meta, and the
    // share link's token is only in config.nodeMeta
    getNodeMeta: vi.fn(() => ({
      volumeId: 'VOLUME',
      linkId: 'LINK',
      userOwnAddress: options.publicLink ? options.publicLink.userOwnAddress : 'member@example.com',
    })),
    config: {
      documentType: 'doc',
      nodeMeta: options.publicLink ? { token: 'TOKEN', linkId: 'LINK' } : { volumeId: 'VOLUME', linkId: 'LINK' },
      clientId: 1,
    },
    // A pending session and the session it bootstraps into are one object, as in the SDK
    bootstrap: vi.fn(async (): Promise<Session> => session as unknown as Session),
    connect: vi.fn(async () => {}),
    disconnect: vi.fn(async () => {}),
    pause: vi.fn(async () => {}),
    resume: vi.fn(async () => {}),
    retry: vi.fn(async () => {}),
    // A public session never squashes, so it has no squash to call
    ...(options.publicLink ? {} : { squash: vi.fn(async () => {}) }),
    sendUpdate: vi.fn(),
    setPresence: vi.fn(),
    comments: comments.comments,
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
    setComments: comments.setSnapshot,
    emitMarkChange: comments.emitMarkChange,
  }
}

/** `session.comments` for tests: its snapshot changes and its marks change by hand, and every verb is a mock. */
function createFakeComments() {
  const listeners = new Set<(snapshot: CommentsSnapshot) => void>()
  const markListeners = new Set<(change: CommentsEvents['markChange']) => void>()
  let current: CommentsSnapshot = { threads: [], hasUnread: false, typers: {}, waitingChanges: 0 }

  const comments = {
    getSnapshot: () => current,
    subscribe: (listener: (snapshot: CommentsSnapshot) => void) => {
      listeners.add(listener)
      return () => {
        listeners.delete(listener)
      }
    },
    on: (_event: 'markChange', listener: (change: CommentsEvents['markChange']) => void) => {
      markListeners.add(listener)
      return () => {
        markListeners.delete(listener)
      }
    },
    createThread: vi.fn(async (_input: { content: string; markId?: string; createMark?: boolean }) => fakeThread()),
    reply: vi.fn(async (_threadId: string, _content: string) => fakeThread().comments[0]),
    editComment: vi.fn(async (_threadId: string, _commentId: string, _content: string) => {}),
    deleteComment: vi.fn(async (_threadId: string, _commentId: string) => {}),
    deleteThread: vi.fn(async (_threadId: string) => {}),
    resolveThread: vi.fn(async (_threadId: string) => {}),
    unresolveThread: vi.fn(async (_threadId: string) => {}),
    createSuggestionThread: vi.fn(async ({ markId }: { markId: string; summary: string }) =>
      fakeThread({ id: 'suggestion-thread-1', markId, type: 'suggestion' }),
    ),
    acceptSuggestion: vi.fn(async (_threadId: string, _summary: string) => {}),
    rejectSuggestion: vi.fn(async (_threadId: string, _summary?: string) => {}),
    reopenSuggestion: vi.fn(async (_threadId: string) => {}),
    markThreadAsRead: vi.fn((_threadId: string) => {}),
    setTyping: vi.fn((_threadId: string, _typing: boolean) => {}),
  }

  return {
    comments,
    setSnapshot: (change: Partial<CommentsSnapshot>) => {
      current = { ...current, ...change }
      listeners.forEach((listener) => listener(current))
    },
    emitMarkChange: (change: CommentsEvents['markChange']) => markListeners.forEach((listener) => listener(change)),
  }
}

/** A comment thread as the SDK holds it, one comment by a peer unless `change` says otherwise */
export function fakeThread(change: Partial<CommentThread> = {}): CommentThread {
  return {
    id: 'thread-1',
    markId: 'mark-1',
    type: 'comment',
    state: 'active',
    createTime: 1_763_900_000_000,
    modifyTime: 1_763_900_000_000,
    comments: [
      {
        id: 'comment-1',
        authorAddress: 'peer@example.com',
        content: 'First',
        type: 'comment',
        createTime: 1_763_900_000_000,
        modifyTime: 1_763_900_000_000,
        verification: 'verified',
        isPlaceholder: false,
      },
    ],
    unread: false,
    isPlaceholder: false,
    ...change,
  }
}

/**
 * A session for tests standing in for a public one, a document reached through a share link: `createFakeSession` with a
 * share link's node meta, and a `getNodeMeta` whose `userOwnAddress` is undefined, an anonymous visitor's, unless the
 * test names one. As the SDK's public session, it has no `squash`.
 */
export function createFakePublicSession(
  snapshot: Partial<SessionSnapshot> = {},
  options: { userOwnAddress?: string } = {},
) {
  const fake = createFakeSession(snapshot, { publicLink: options })
  return { ...fake, session: fake.session as unknown as PublicSession }
}
