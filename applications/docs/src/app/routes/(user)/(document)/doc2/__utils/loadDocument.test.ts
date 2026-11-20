import { waitFor } from '@testing-library/react'

import { BroadcastSource } from '@proton/docs-shared/Bridge/BroadcastSource'
import { MemberRole, ValidationError, generateNodeUid } from '@proton/drive/sdk'
import { isDevOrBlack } from '@proton/shared/lib/env'
import { PROTON_DOCS_DOCUMENT_MIMETYPE } from '@proton/shared/lib/helpers/mimetype'
import { DocsApiError, DocsApiErrorCode } from '@proton-docs/realtime-sdk'
import type { Participant, SessionSnapshot } from '@proton-docs/realtime-sdk'

import type { ClientHandler } from './createClientHandler'
import { createFakeSession } from './createFakeSession'
import {
  EDITOR_FRAME_READY_TIMEOUT_MS,
  type LoaderDeps,
  type LoaderStatus,
  type LoaderStep,
  loadDocument,
} from './loadDocument'
import { DocsLoadMark } from './loadMarks'
import { docsLoadMarks, withNodePerformance } from './loadMarksTesting'

jest.mock('@proton/shared/lib/env', () => ({
  ...jest.requireActual('@proton/shared/lib/env'),
  isDevOrBlack: jest.fn(() => false),
}))

/** Every call doc2 makes to the editor, in order */
const mockEditorCalls: string[] = []
let mockClientHandler: ClientHandler
const mockDestroyBridge = jest.fn()
const mockBridgeBuilt = jest.fn()
const mockEditor = {
  receiveMessage: jest.fn(async ({ content, origin }: { content: Uint8Array<ArrayBuffer>; origin?: unknown }) => {
    mockEditorCalls.push(`receiveMessage:${content[0]}${origin === undefined ? '' : ':base'}`)
  }),
  initializeEditor: jest.fn(async (_id: string, _address: string, role: string) => {
    mockEditorCalls.push(`initializeEditor:${role}`)
  }),
  showEditor: jest.fn(async () => {
    mockEditorCalls.push('showEditor')
  }),
  changeLockedState: jest.fn(async (locked: boolean) => {
    mockEditorCalls.push(locked ? 'lock' : 'unlock')
  }),
  broadcastPresenceState: jest.fn(async () => {}),
}
jest.mock('./ClientEditorBridge', () => ({
  ClientEditorBridge: jest.fn().mockImplementation((_frame, clientHandler: ClientHandler) => {
    mockBridgeBuilt()
    mockClientHandler = clientHandler
    return { editorInvoker: mockEditor, destroy: mockDestroyBridge }
  }),
}))

const NODE_UID = generateNodeUid('VOLUME', 'LINK')
const BASE_UPDATES = [1, 2]
const ROLES = { Admin: MemberRole.Admin, Editor: MemberRole.Editor, Viewer: MemberRole.Viewer }
const STEPS: LoaderStep[] = ['node', 'bootstrap', 'frame', 'baseState', 'catchUp', 'initialize', 'show', 'settle']

function hierarchy(role: keyof typeof ROLES, node: object = {}) {
  return [
    { uid: 'ROOT', directRole: MemberRole.Inherited },
    { uid: NODE_UID, mediaType: PROTON_DOCS_DOCUMENT_MIMETYPE, directRole: ROLES[role], ...node },
  ]
}

function update(firstByte: number) {
  return {
    content: new Uint8Array([firstByte]),
    authorAddress: 'author@example.com',
    timestamp: 0,
    signature: new Uint8Array(),
    aad: '',
  }
}

/** `count` users, one client each, the user's own first */
function users(count: number): Participant[] {
  return Array.from({ length: count }, (_, user) => ({
    id: user,
    isSelf: user === 0,
    state: { name: `user ${user}`, anchorPos: null, focusPos: null, awarenessData: { userId: `user-${user}` } },
    lastSeenAt: 0,
  }))
}

/**
 * Starts a load with fakes: a session that catches up only when told, a frame given by hand unless `frameReady`, and
 * every status the run dispatches recorded
 */
function startLoad({
  role = 'Editor',
  frameReady = true,
  readHierarchy = async () => hierarchy(role),
}: { role?: keyof typeof ROLES; frameReady?: boolean; readHierarchy?: () => Promise<unknown> } = {}) {
  const fake = createFakeSession()
  fake.mocks.getBaseState.mockReturnValue({ commitId: 'commit-1', updates: BASE_UPDATES.map(update) })
  const drive = { getNodeHierarchy: jest.fn((_uid: string) => readHierarchy()) }
  const prefetch = {
    nodeMeta: { volumeId: 'VOLUME', linkId: 'LINK' },
    confirm: jest.fn(),
    end: jest.fn(() => ({ reads: 3, served: 3 })),
  }
  const client = {
    createSession: jest.fn((_config: unknown) => fake.session),
    prefetchBootstrap: jest.fn((_nodeMeta: unknown) => prefetch),
  }
  const logger = { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() }
  const sendEditorBasics = jest.fn(() => {
    mockEditorCalls.push('basics')
  })
  const deps = {
    client,
    drive,
    nodeMeta: { volumeId: 'VOLUME', linkId: 'LINK' },
    logger,
    appVersion: '1.2.3',
    sendEditorBasics,
    bridgeHandlers: {
      isFlagEnabled: () => false,
      onWordCount: jest.fn(),
      showModal: jest.fn(),
      onFileMenuAction: jest.fn(),
      onPresenceUpdate: jest.fn(),
      fetchExternalImageAsBase64: jest.fn(),
      logger,
    },
  } as unknown as LoaderDeps
  let giveFrame: () => void = () => {}
  const frame = new Promise<HTMLIFrameElement>(
    (resolve) => (giveFrame = () => resolve(document.createElement('iframe'))),
  )
  if (frameReady) {
    giveFrame()
  }
  const statuses: LoaderStatus[] = []
  const controller = new AbortController()
  const done = loadDocument(deps, { frame, dispatch: (status) => statuses.push(status), signal: controller.signal })

  return {
    fake,
    drive,
    client,
    prefetch,
    logger,
    deps,
    statuses,
    controller,
    done,
    giveFrame,
    latest: () => statuses.at(-1)!,
    steps: () => statuses.flatMap((status) => ('step' in status ? [status.step] : [])),
    catchUp: () => fake.setSnapshot({ status: { name: 'connected' }, caughtUp: true }),
    render: () => mockClientHandler.updateFrameSize(480),
  }
}

/** Starts a load and takes it to the Reveal Point */
async function startRevealed(options?: Parameters<typeof startLoad>[0]) {
  const load = startLoad(options)
  await waitFor(() => expect(load.fake.mocks.connect).toHaveBeenCalled())
  load.catchUp()
  await waitFor(() => expect(mockEditor.changeLockedState).toHaveBeenCalled())
  load.render()
  await waitFor(() => expect(load.latest().name).toBe('revealed'))
  mockEditorCalls.length = 0
  return load
}

/** Has the editor hold its answer to every next lock call until the test answers it */
function holdLockAnswers() {
  const answers: (() => void)[] = []
  mockEditor.changeLockedState.mockImplementation(async (locked: boolean) => {
    mockEditorCalls.push(locked ? 'lock' : 'unlock')
    await new Promise<void>((resolve) => answers.push(resolve))
  })
  return answers
}

const flush = () => new Promise((resolve) => setTimeout(resolve, 0))

describe('loadDocument', () => {
  afterEach(() => {
    mockEditorCalls.length = 0
    jest.clearAllMocks()
    mockEditor.changeLockedState.mockImplementation(async (locked: boolean) => {
      mockEditorCalls.push(locked ? 'lock' : 'unlock')
    })
    mockEditor.receiveMessage.mockImplementation(async ({ content, origin }) => {
      mockEditorCalls.push(`receiveMessage:${content[0]}${origin === undefined ? '' : ':base'}`)
    })
    jest.useRealTimers()
  })

  test('runs the steps in order, each once, and reveals the document', async () => {
    const load = startLoad()
    await waitFor(() => expect(load.fake.mocks.connect).toHaveBeenCalled())
    load.fake.emit('update', update(3))
    load.catchUp()
    await waitFor(() => expect(mockEditorCalls).toContain('unlock'))

    expect(load.latest()).toMatchObject({ name: 'loading', step: 'settle' })

    load.render()
    await waitFor(() => expect(load.latest().name).toBe('revealed'))

    expect([...new Set(load.steps())]).toEqual(STEPS)
    expect(mockEditorCalls).toEqual([
      'receiveMessage:1:base',
      'receiveMessage:2:base',
      'receiveMessage:3',
      'basics',
      'initializeEditor:Editor',
      'showEditor',
      'unlock',
    ])
    expect(load.latest()).toEqual({
      name: 'revealed',
      node: expect.objectContaining({ uid: NODE_UID }),
      role: 'Editor',
      session: load.fake.session,
      editorInvoker: mockEditor,
      editRefused: false,
    })
    expect(load.drive.getNodeHierarchy).toHaveBeenCalledTimes(1)
    expect(load.drive.getNodeHierarchy).toHaveBeenCalledWith(NODE_UID)
    expect(load.client.createSession).toHaveBeenCalledWith({
      documentType: 'doc',
      nodeMeta: { volumeId: 'VOLUME', linkId: 'LINK' },
      prefetch: load.prefetch,
    })
    expect(mockBridgeBuilt).toHaveBeenCalledTimes(1)
    expect(mockEditor.broadcastPresenceState).toHaveBeenCalled()
  })

  test('hands the page the node and role, then the session, then the editor once it holds the base state', async () => {
    const load = startLoad()
    await waitFor(() => expect(load.fake.mocks.connect).toHaveBeenCalled())

    const at = (step: LoaderStep) => load.statuses.find((status) => 'step' in status && status.step === step)
    expect(at('node')).toMatchObject({ node: undefined, session: undefined })
    expect(at('bootstrap')).toMatchObject({ node: { uid: NODE_UID }, role: 'Editor', session: undefined })
    expect(at('frame')).toMatchObject({ session: load.fake.session, editorInvoker: undefined })
    expect(at('baseState')).toMatchObject({ editorInvoker: undefined })
    expect(at('catchUp')).toMatchObject({ editorInvoker: mockEditor })
  })

  describe("the bootstrap's prefetch", () => {
    test('are prefetched and confirmed from the start, beside the node step, and the prefetch ends when the bootstrap does', async () => {
      let readNode: () => void = () => {}
      let bootstrap: () => void = () => {}
      const load = startLoad({
        readHierarchy: () => new Promise((resolve) => (readNode = () => resolve(hierarchy('Editor')))),
      })
      load.fake.mocks.bootstrap.mockReturnValueOnce(
        new Promise((resolve) => (bootstrap = () => resolve(load.fake.session))),
      )

      expect(load.client.prefetchBootstrap).toHaveBeenCalledWith({ volumeId: 'VOLUME', linkId: 'LINK' })
      expect(load.drive.getNodeHierarchy).toHaveBeenCalled()
      expect(load.prefetch.confirm).toHaveBeenCalledTimes(1)

      readNode()
      await waitFor(() => expect(load.client.createSession).toHaveBeenCalled())
      expect(load.prefetch.end).not.toHaveBeenCalled()

      bootstrap()
      await waitFor(() => expect(load.steps()).toContain('frame'))
      expect(load.prefetch.end).toHaveBeenCalledTimes(1)
      expect(load.client.prefetchBootstrap).toHaveBeenCalledTimes(1)
      expect(load.client.createSession).toHaveBeenCalledWith(expect.objectContaining({ prefetch: load.prefetch }))
    })

    test.each<[string, Parameters<typeof startLoad>[0]]>([
      ['trashed', { readHierarchy: async () => hierarchy('Admin', { trashTime: new Date() }) }],
      ['unsupported', { readHierarchy: async () => hierarchy('Editor', { mediaType: 'application/pdf' }) }],
      ['unreadable by Drive', { readHierarchy: () => Promise.reject(new Error('Boom')) }],
    ])('end with a node that is %s', async (_, options) => {
      const load = startLoad(options)

      await load.done

      expect(load.prefetch.end).toHaveBeenCalledTimes(1)
    })

    test('end with a bootstrap that fails', async () => {
      const load = startLoad()
      load.fake.mocks.bootstrap.mockRejectedValueOnce(new Error('Boom'))

      await load.done

      expect(load.prefetch.end).toHaveBeenCalledTimes(1)
    })

    test.each<LoaderStep>(['node', 'bootstrap'])('end with an abort in the %s step', async (step) => {
      const load = startLoad(step === 'node' ? { readHierarchy: () => new Promise(() => {}) } : {})
      load.fake.mocks.bootstrap.mockReturnValueOnce(new Promise(() => {}))
      await waitFor(() => expect(load.latest()).toMatchObject({ step }))

      load.controller.abort()
      await load.done

      expect(load.prefetch.end).toHaveBeenCalledTimes(1)
    })
  })

  test('squashes at 50 document updates on dev and black, as /doc does', async () => {
    jest.mocked(isDevOrBlack).mockReturnValueOnce(true)
    const load = startLoad()

    await waitFor(() =>
      expect(load.client.createSession).toHaveBeenCalledWith(expect.objectContaining({ commitDuLimit: 50 })),
    )
  })

  describe('the editor frame', () => {
    test.each([
      ['before its step', 'before'],
      ['during its step', 'during'],
    ])('arriving %s, is awaited by the frame step only', async (_, when) => {
      const load = startLoad({ frameReady: when === 'before' })
      await waitFor(() => expect(load.steps()).toContain('frame'))
      await flush()

      expect(mockBridgeBuilt).toHaveBeenCalledTimes(when === 'before' ? 1 : 0)

      load.giveFrame()
      await waitFor(() => expect(load.fake.mocks.connect).toHaveBeenCalled())
      expect(mockBridgeBuilt).toHaveBeenCalledTimes(1)
    })

    test('arriving after the bootstrap step started waits for it, and the session first', async () => {
      let bootstrap: () => void = () => {}
      const load = startLoad({ frameReady: false })
      load.fake.mocks.bootstrap.mockReturnValueOnce(
        new Promise((resolve) => (bootstrap = () => resolve(load.fake.session))),
      )
      await waitFor(() => expect(load.steps()).toContain('bootstrap'))
      load.giveFrame()
      await flush()

      expect(mockBridgeBuilt).not.toHaveBeenCalled()

      bootstrap()
      await waitFor(() => expect(mockBridgeBuilt).toHaveBeenCalledTimes(1))
    })

    test('aborted while waiting for it, builds no bridge on a frame that arrives afterwards', async () => {
      const load = startLoad({ frameReady: false })
      await waitFor(() => expect(load.steps()).toContain('frame'))

      load.controller.abort()
      load.giveFrame()
      await load.done
      await flush()

      expect(mockBridgeBuilt).not.toHaveBeenCalled()
      expect(load.fake.mocks.disconnect).toHaveBeenCalledTimes(1)
    })

    test(`fails the editor when it is not there within ${EDITOR_FRAME_READY_TIMEOUT_MS} ms of its step`, async () => {
      jest.useFakeTimers()
      const load = startLoad({ frameReady: false })
      await jest.advanceTimersByTimeAsync(0)
      expect(load.steps()).toContain('frame')

      await jest.advanceTimersByTimeAsync(EDITOR_FRAME_READY_TIMEOUT_MS)

      expect(load.latest()).toEqual({ name: 'failed', reason: 'editorFailed', session: load.fake.session })
      expect(load.logger.error).toHaveBeenCalledWith(
        'Document load step failed',
        expect.objectContaining({ step: 'frame' }),
        expect.any(Error),
      )
    })
  })

  describe('marks, measures and logs', () => {
    withNodePerformance()

    test("places an editor's marks once each, in order, and the revealed mark last", async () => {
      await startRevealed()

      expect(docsLoadMarks()).toEqual([
        DocsLoadMark.DocumentLoaded,
        DocsLoadMark.BaseStateSent,
        DocsLoadMark.CaughtUp,
        DocsLoadMark.EditorShown,
        DocsLoadMark.EditorEditable,
        DocsLoadMark.Revealed,
      ])
    })

    test('reveals a viewer with no editable mark, its editor locked', async () => {
      await startRevealed({ role: 'Viewer' })

      expect(mockEditor.changeLockedState).toHaveBeenLastCalledWith(true)
      expect(docsLoadMarks()).not.toContain(DocsLoadMark.EditorEditable)
      expect(docsLoadMarks().at(-1)).toBe(DocsLoadMark.Revealed)
    })

    test('marks editable only once the editor is rendered, after it answered the unlock', async () => {
      const load = startLoad()
      await waitFor(() => expect(load.fake.mocks.connect).toHaveBeenCalled())
      load.catchUp()
      await waitFor(() => expect(mockEditorCalls).toContain('unlock'))
      await flush()

      expect(docsLoadMarks()).not.toContain(DocsLoadMark.EditorEditable)

      load.render()
      await waitFor(() =>
        expect(docsLoadMarks().slice(-2)).toEqual([DocsLoadMark.EditorEditable, DocsLoadMark.Revealed]),
      )
    })

    test('measures each step as docs-loader:<step> and logs one line for each', async () => {
      const load = await startRevealed()

      expect(
        performance
          .getEntriesByType('measure')
          .map(({ name }) => name)
          .filter((name) => name.startsWith('docs-loader:')),
      ).toEqual(STEPS.map((step) => `docs-loader:${step}`))
      const logged = load.logger.info.mock.calls.filter(([message]) => message === 'Document load step done')
      expect(logged.map(([, { step }]) => step)).toEqual(STEPS)
      expect(logged.every(([, { durationMs }]) => typeof durationMs === 'number')).toBe(true)
    })

    test("a new run measures afresh, so that the time line holds the latest run's steps only", async () => {
      const first = await startRevealed()
      first.controller.abort()

      const second = startLoad()
      await waitFor(() => expect(second.fake.mocks.connect).toHaveBeenCalled())

      expect(
        performance
          .getEntriesByType('measure')
          .map(({ name }) => name)
          .filter((name) => name.startsWith('docs-loader:')),
      ).toEqual(['docs-loader:node', 'docs-loader:bootstrap', 'docs-loader:frame', 'docs-loader:baseState'])
    })

    test('a rebootstrap that catches up again marks nothing', async () => {
      const load = await startRevealed()
      const marks = performance.getEntriesByType('mark')

      load.fake.setSnapshot({ status: { name: 'opening' } })
      load.fake.setSnapshot({ status: { name: 'connected' } })
      await flush()

      expect(performance.getEntriesByType('mark')).toEqual(marks)
    })
  })

  test('opens in a browser that places no marks', async () => {
    const spy = jest.spyOn(globalThis, 'performance', 'get').mockReturnValue(undefined as unknown as Performance)

    const load = await startRevealed()

    expect(load.latest().name).toBe('revealed')
    spy.mockRestore()
  })

  test('sends each base state update once the editor has answered the one before', async () => {
    let answerFirst: () => void = () => {}
    mockEditor.receiveMessage.mockImplementationOnce(() => new Promise<void>((resolve) => (answerFirst = resolve)))
    const load = startLoad()
    await waitFor(() => expect(mockEditor.receiveMessage).toHaveBeenCalledTimes(1))
    await flush()

    expect(mockEditor.receiveMessage).toHaveBeenCalledTimes(1)

    answerFirst()

    await waitFor(() => expect(mockEditor.receiveMessage).toHaveBeenCalledTimes(BASE_UPDATES.length))
    await waitFor(() => expect(load.fake.mocks.connect).toHaveBeenCalled())
  })

  test("initializes the editor for the user's address, role and app version, not in public mode", async () => {
    const load = await startRevealed({ role: 'Viewer' })

    expect(mockEditor.initializeEditor).toHaveBeenCalledWith(
      expect.any(String),
      'member@example.com',
      'Viewer',
      false,
      '1.2.3',
    )
    expect(load.latest().name).toBe('revealed')
  })

  describe('updates', () => {
    test('reach the editor after the base state, in order, and keep coming after the reveal', async () => {
      const load = await startRevealed()

      load.fake.emit('update', update(4))
      load.fake.emit('baseStateReplaced', { base: { commitId: 'commit-2', updates: [update(5), update(6)] } })
      load.fake.emit('update', update(7))

      expect(mockEditorCalls).toEqual([
        'receiveMessage:4',
        'receiveMessage:5:base',
        'receiveMessage:6:base',
        'receiveMessage:7',
      ])
    })

    test("the user's edits go to the session", async () => {
      const load = await startRevealed()
      const edit = new Uint8Array([9])

      await mockClientHandler.editorRequestsPropagationOfUpdate(
        { type: { wrapper: 'du' }, content: edit },
        BroadcastSource.DocumentBufferFlush,
      )

      expect(load.fake.mocks.sendUpdate).toHaveBeenCalledWith(edit)
    })

    test('an update the editor fails to take fails the editor, and clears the user from peers', async () => {
      const load = await startRevealed()
      mockEditor.receiveMessage.mockRejectedValueOnce(new Error('No answer'))

      load.fake.emit('update', update(4))

      await waitFor(() =>
        expect(load.latest()).toEqual({ name: 'failed', reason: 'editorFailed', session: load.fake.session }),
      )
      expect(load.fake.mocks.setPresence).toHaveBeenCalledWith(null)
      expect(mockDestroyBridge).toHaveBeenCalled()
      expect(load.fake.listenerCount()).toBe(0)
      expect(load.fake.mocks.disconnect).not.toHaveBeenCalled()
      await expect(load.done).resolves.toBeUndefined()
    })
  })

  describe('the lock', () => {
    test('reaches the editor only once it is shown', async () => {
      const load = startLoad()
      await waitFor(() => expect(load.fake.mocks.connect).toHaveBeenCalled())
      load.fake.setSnapshot({ editing: { allowed: false, reason: 'sizeLocked' } })
      load.fake.setSnapshot({ editing: { allowed: true } })
      await flush()

      expect(mockEditor.changeLockedState).not.toHaveBeenCalled()

      load.catchUp()
      await waitFor(() => expect(mockEditorCalls.slice(-2)).toEqual(['showEditor', 'unlock']))
    })

    test.each<[string, Partial<SessionSnapshot>]>([
      ['stopped', { status: { name: 'stopped', condition: 'transient', retryable: true } }],
      ['delivery failed', { delivery: 'failed' }],
      ['editing not allowed', { editing: { allowed: false, reason: 'sizeLocked' } }],
      ['an incomplete base state', { editing: { allowed: false, reason: 'incompleteBaseState' } }],
      ['the participant limit', { participants: users(20) }],
    ])('locks an open editor while %s, and unlocks it once that clears', async (_, cause) => {
      const load = await startRevealed()
      const clear = Object.fromEntries(
        Object.keys(cause).map((key) => [key, load.fake.session.getSnapshot()[key as keyof SessionSnapshot]]),
      )

      load.fake.setSnapshot(cause)
      await flush()
      load.fake.setSnapshot(clear)
      await flush()

      expect(mockEditorCalls).toEqual(['lock', 'unlock'])
    })

    test('lets an admin edit at the participant limit', async () => {
      const load = await startRevealed({ role: 'Admin' })

      load.fake.setSnapshot({ participants: users(20) })
      await flush()

      expect(mockEditorCalls).toEqual([])
    })

    test('keeps a viewer locked, whatever the session does', async () => {
      const load = await startRevealed({ role: 'Viewer' })

      load.fake.setSnapshot({ delivery: 'pending' })
      load.fake.setSnapshot({ participants: users(2) })
      await flush()

      expect(mockEditorCalls).toEqual([])
    })

    test('stays locked for good after the SDK refused an edit', async () => {
      const load = await startRevealed()

      load.fake.emit('refusal', { reason: 'updateTooLarge', attemptedBytes: 2, limitBytes: 1 })
      load.fake.setSnapshot({
        status: { name: 'reconnecting', condition: 'transient', nextAttemptAt: 0, budgetExpiresAt: 0 },
      })
      load.fake.setSnapshot({ status: { name: 'connected' } })
      await flush()

      expect(mockEditorCalls).toEqual(['lock'])
      // The page reads it too: the history's restore follows the same lock
      expect(load.latest()).toMatchObject({ name: 'revealed', editRefused: true })
    })

    test('stays editable while paused or reconnecting', async () => {
      const load = await startRevealed()

      load.fake.setSnapshot({ status: { name: 'paused' }, delivery: 'pending' })
      load.fake.setSnapshot({
        status: { name: 'reconnecting', condition: 'transient', nextAttemptAt: 0, budgetExpiresAt: 0 },
      })
      load.fake.setSnapshot({ delivery: 'degraded' })
      await flush()

      expect(mockEditorCalls).toEqual([])
    })

    test('a lock call the editor fails fails the editor', async () => {
      const load = await startRevealed()
      mockEditor.changeLockedState.mockRejectedValueOnce(new Error('No answer'))

      load.fake.setSnapshot({ delivery: 'failed' })

      await waitFor(() => expect(load.latest()).toMatchObject({ name: 'failed', reason: 'editorFailed' }))
    })
  })

  describe('after a rebootstrap', () => {
    const rebootstrap = (load: ReturnType<typeof startLoad>) => {
      load.fake.setSnapshot({ status: { name: 'opening' } })
      load.fake.setSnapshot({ status: { name: 'connected' } })
    }

    test('reads the role again, re-locks the editor for it, and hands the page the new role', async () => {
      const load = await startRevealed()
      load.drive.getNodeHierarchy.mockResolvedValue(hierarchy('Viewer'))

      rebootstrap(load)

      await waitFor(() => expect(load.latest()).toMatchObject({ name: 'revealed', role: 'Viewer' }))
      expect(mockEditorCalls).toEqual(['lock'])
      expect(load.drive.getNodeHierarchy).toHaveBeenLastCalledWith(NODE_UID)
      expect(mockEditor.initializeEditor).toHaveBeenCalledTimes(1)
      expect(mockBridgeBuilt).toHaveBeenCalledTimes(1)
    })

    test('applies the lock again for an unchanged role', async () => {
      const load = await startRevealed()

      rebootstrap(load)

      await waitFor(() => expect(mockEditorCalls).toEqual(['unlock']))
    })

    test('reads no role on status changes that skip opening', async () => {
      const load = await startRevealed()

      load.fake.setSnapshot({ status: { name: 'connecting' } })
      load.fake.setSnapshot({ status: { name: 'connected' } })
      await flush()

      expect(load.drive.getNodeHierarchy).toHaveBeenCalledTimes(1)
    })

    test('applies only the latest of two overlapping reads', async () => {
      const load = await startRevealed()
      let resolveFirst: (hierarchy: unknown) => void = () => {}
      load.drive.getNodeHierarchy
        .mockReturnValueOnce(new Promise((resolve) => (resolveFirst = resolve)))
        .mockResolvedValueOnce(hierarchy('Admin'))

      rebootstrap(load)
      rebootstrap(load)
      await waitFor(() => expect(load.latest()).toMatchObject({ role: 'Admin' }))
      resolveFirst(hierarchy('Viewer'))
      await flush()

      expect(load.latest()).toMatchObject({ role: 'Admin' })
    })

    test('keeps the role when the read fails', async () => {
      const load = await startRevealed()
      load.drive.getNodeHierarchy.mockRejectedValue(new Error('Drive failed'))

      rebootstrap(load)
      await flush()

      expect(load.latest()).toMatchObject({ name: 'revealed', role: 'Editor' })
      expect(load.logger.warn).toHaveBeenCalledWith(
        'Failed to read the role again after a rebootstrap',
        expect.any(Error),
      )
    })

    test('a read before the editor is shown changes the role it is initialized with, and sends no lock', async () => {
      const load = startLoad()
      await waitFor(() => expect(load.fake.mocks.connect).toHaveBeenCalled())
      load.drive.getNodeHierarchy.mockResolvedValue(hierarchy('Viewer'))

      rebootstrap(load)
      await waitFor(() => expect(load.latest()).toMatchObject({ role: 'Viewer' }))
      expect(mockEditor.changeLockedState).not.toHaveBeenCalled()
      load.catchUp()

      await waitFor(() => expect(mockEditorCalls.slice(-3)).toEqual(['initializeEditor:Viewer', 'showEditor', 'lock']))
    })
  })

  describe('a session stopped before the Reveal Point', () => {
    test.each([true, false])(
      'says so, retryable %s, in its step, and goes back to loading once it leaves',
      async (retryable) => {
        const load = startLoad()
        await waitFor(() => expect(load.fake.mocks.connect).toHaveBeenCalled())

        load.fake.setSnapshot({ status: { name: 'stopped', condition: 'transient', retryable } })

        expect(load.latest()).toMatchObject({ name: 'stopped', step: 'catchUp', retryable, session: load.fake.session })

        load.fake.setSnapshot({ status: { name: 'connecting' } })

        expect(load.latest()).toMatchObject({ name: 'loading', step: 'catchUp' })
      },
    )

    test('reveals only once the editor answers the unlock after a retry, not the lock it answered while stopped', async () => {
      const answers = holdLockAnswers()
      const load = startLoad()
      await waitFor(() => expect(load.fake.mocks.connect).toHaveBeenCalled())
      load.catchUp()
      await waitFor(() => expect(answers).toHaveLength(1))
      load.render()

      load.fake.setSnapshot({ status: { name: 'stopped', condition: 'transient', retryable: true } })
      answers[0]()
      await waitFor(() => expect(answers).toHaveLength(2))
      answers[1]()
      await flush()

      expect(mockEditorCalls.slice(-2)).toEqual(['unlock', 'lock'])
      expect(load.latest()).toMatchObject({ name: 'stopped', step: 'settle' })

      load.fake.setSnapshot({ status: { name: 'connected' } })
      await waitFor(() => expect(answers).toHaveLength(3))

      expect(load.latest()).toMatchObject({ name: 'loading', step: 'settle' })

      answers[2]()
      await waitFor(() => expect(load.latest().name).toBe('revealed'))
    })

    test('after the reveal, a stop keeps the document revealed', async () => {
      const load = await startRevealed()
      const dispatched = load.statuses.length

      load.fake.setSnapshot({ status: { name: 'stopped', condition: 'transient', retryable: true } })
      load.fake.setSnapshot({ status: { name: 'connected' } })
      await flush()

      expect(load.statuses).toHaveLength(dispatched)
    })

    test('a connect that rejects is logged, and the run waits', async () => {
      const load = startLoad()
      load.fake.mocks.connect.mockRejectedValueOnce(new Error('Client rejected'))

      await waitFor(() =>
        expect(load.logger.error).toHaveBeenCalledWith('Failed to connect the document session', expect.any(Error)),
      )
      expect(load.latest()).toMatchObject({ name: 'loading', step: 'catchUp' })
    })
  })

  describe('outcomes', () => {
    test('a node that is not a text document is unsupported, and opens no session', async () => {
      const load = startLoad({ readHierarchy: async () => hierarchy('Editor', { mediaType: 'application/pdf' }) })

      await load.done

      expect(load.latest()).toEqual({ name: 'failed', reason: 'unsupported', session: undefined })
      expect(load.client.createSession).not.toHaveBeenCalled()
    })

    test('a document in the trash is trashed, with its node and role, and opens no session', async () => {
      const load = startLoad({ readHierarchy: async () => hierarchy('Admin', { trashTime: new Date() }) })

      await load.done

      expect(load.latest()).toEqual({
        name: 'trashed',
        node: expect.objectContaining({ uid: NODE_UID }),
        role: 'Admin',
      })
      expect(load.client.createSession).not.toHaveBeenCalled()
    })

    test('a hierarchy that does not end with the document fails, and opens no session', async () => {
      const load = startLoad({ readHierarchy: async () => hierarchy('Editor').slice(0, 1) })

      await load.done

      expect(load.latest()).toMatchObject({ name: 'failed', reason: 'bootstrapFailed' })
      expect(load.client.createSession).not.toHaveBeenCalled()
    })

    test.each<[string, unknown, string]>([
      ['a node Drive does not find for the user', new ValidationError('Item not found', 2501), 'noAccess'],
      ['no access', new DocsApiError('getDocumentMeta', 403), 'noAccess'],
      ['no access', new DocsApiError('getDocumentMeta', 422, DocsApiErrorCode.InsufficientPermissions), 'noAccess'],
      ['not found', new DocsApiError('getDocumentMeta', 404), 'notFound'],
      ['an unreachable Docs API', new DocsApiError('getCommitData'), 'unreachable'],
      ['any other Docs API failure', new DocsApiError('getCommitData', 500), 'bootstrapFailed'],
      ['any other failure', new Error('Boom'), 'bootstrapFailed'],
    ])('%s fails the load by its cause', async (_, cause, reason) => {
      const fromDrive = cause instanceof ValidationError
      const load = startLoad(fromDrive ? { readHierarchy: () => Promise.reject(cause) } : {})
      if (!fromDrive) {
        load.fake.mocks.bootstrap.mockRejectedValueOnce(cause as Error)
      }

      await load.done

      expect(load.latest()).toEqual({ name: 'failed', reason, session: undefined })
      expect(load.logger.error).toHaveBeenCalledWith('Document load step failed', expect.any(Object), cause)
    })

    test('a base state with an unreadable update fails, and disconnects the session', async () => {
      const load = startLoad()
      load.fake.mocks.bootstrap.mockImplementationOnce(async () => {
        load.fake.emit('updateUnreadable', { uuid: 'update-1', origin: 'baseState' })
        return load.fake.session
      })

      await load.done

      expect(load.latest()).toEqual({ name: 'failed', reason: 'unreadableUpdate', session: undefined })
      expect(load.fake.mocks.disconnect).toHaveBeenCalledTimes(1)
      expect(load.fake.listenerCount()).toBe(0)
    })

    test('a live update that cannot be read is only logged', async () => {
      const load = await startRevealed()

      load.fake.emit('updateUnreadable', { uuid: 'update-2', origin: 'live' })

      expect(load.logger.warn).toHaveBeenCalledWith('Live DU could not be read', { uuid: 'update-2', origin: 'live' })
      expect(load.latest().name).toBe('revealed')
    })

    test.each(['initializeEditor', 'showEditor'] as const)(
      'an editor that fails %s fails the editor',
      async (method) => {
        const load = startLoad()
        mockEditor[method].mockRejectedValueOnce(new Error('No answer'))
        await waitFor(() => expect(load.fake.mocks.connect).toHaveBeenCalled())
        load.catchUp()

        await load.done

        expect(load.latest()).toMatchObject({ name: 'failed', reason: 'editorFailed' })
      },
    )

    test("an editor reporting an error fails it, whatever step it's in", async () => {
      const load = startLoad()
      await waitFor(() => expect(load.fake.mocks.connect).toHaveBeenCalled())

      void mockClientHandler.reportUserInterfaceError(new Error('Crashed') as never)
      await load.done

      expect(load.latest()).toMatchObject({ name: 'failed', reason: 'editorFailed' })
    })
  })

  describe('abort', () => {
    test.each(STEPS)(
      'in the %s step removes every listener, destroys the bridge, disconnects the session, and dispatches nothing more',
      async (step) => {
        const answers = holdLockAnswers()
        let bootstrap: () => void = () => {}
        const load = startLoad({
          frameReady: step !== 'frame',
          ...(step === 'node' && { readHierarchy: () => new Promise(() => {}) }),
        })
        load.fake.mocks.bootstrap.mockReturnValueOnce(
          new Promise((resolve) => (bootstrap = () => resolve(load.fake.session))),
        )
        if (step === 'initialize') {
          mockEditor.initializeEditor.mockImplementationOnce(() => new Promise(() => {}))
        }
        if (step === 'show') {
          mockEditor.showEditor.mockImplementationOnce(() => new Promise(() => {}))
        }
        if (step === 'baseState') {
          mockEditor.receiveMessage.mockImplementationOnce(() => new Promise(() => {}))
        }
        if (step !== 'bootstrap') {
          bootstrap()
        }
        if (['initialize', 'show', 'settle'].includes(step)) {
          await waitFor(() => expect(load.fake.mocks.connect).toHaveBeenCalled())
          load.catchUp()
        }
        await waitFor(() => expect(load.latest()).toMatchObject({ step }))
        await flush()
        const dispatched = load.statuses.length

        load.controller.abort()
        bootstrap()
        answers.forEach((answer) => answer())
        load.giveFrame()
        await load.done
        await flush()

        expect(load.statuses).toHaveLength(dispatched)
        expect(load.fake.listenerCount()).toBe(0)
        const bootstrapped = step !== 'node'
        expect(load.fake.mocks.disconnect).toHaveBeenCalledTimes(bootstrapped ? 1 : 0)
        expect(mockDestroyBridge).toHaveBeenCalledTimes(mockBridgeBuilt.mock.calls.length)
        expect(load.logger.error).not.toHaveBeenCalled()
      },
    )

    test('after the reveal ends the run, and nothing marks or dispatches afterwards', async () => {
      const load = await startRevealed()
      const dispatched = load.statuses.length

      load.controller.abort()
      await load.done
      load.fake.setSnapshot({ status: { name: 'opening' } })
      load.fake.setSnapshot({ status: { name: 'connected' }, delivery: 'failed' })
      await flush()

      expect(load.statuses).toHaveLength(dispatched)
      expect(mockEditorCalls).toEqual([])
      expect(mockDestroyBridge).toHaveBeenCalledTimes(1)
      expect(load.fake.mocks.disconnect).toHaveBeenCalledTimes(1)
      expect(load.drive.getNodeHierarchy).toHaveBeenCalledTimes(1)
    })
  })
})
