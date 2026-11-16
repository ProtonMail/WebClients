import { DocUpdateOrigin } from '@proton/docs-shared/Doc/DocState'
import { GenerateUUID } from '@proton/docs-shared/GenerateUuid'
import { type NodeEntity, generateNodeUid, type getDrive } from '@proton/drive/sdk'
import { isDevOrBlack } from '@proton/shared/lib/env'
import { isProtonDocsDocument } from '@proton/shared/lib/helpers/mimetype'
import type { LoggerInterface } from '@proton/shared/lib/logs'
import type { PrivateNodeMeta, Session } from '@proton-docs/realtime-sdk'

import { ClientEditorBridge } from './ClientEditorBridge'
import type { EditorInvoker } from './EditorInvoker'
import { type BootstrapFailure, classifyBootstrapError } from './classifyBootstrapError'
import { type ClientHandlerDependencies, createClientHandler } from './createClientHandler'
import { type DocumentRole, getDocumentRole } from './getDocumentRole'
import { DocsLoadMark, type DocsLoadMarkName, markDocsLoad } from './loadMarks'
import { type LockCall, isLocked, isRevealPoint } from './loadingScreen'
import type { useRealtimeClient } from './useRealtimeClient'

export const EDITOR_FRAME_READY_TIMEOUT_MS = 30_000

/** The prefix of each step's measure on the page's time line, `docs-loader:<step>` */
const LOADER_MEASURE_PREFIX = 'docs-loader:'

/** The Loader's steps, in the order it runs them */
export type LoaderStep = 'node' | 'bootstrap' | 'frame' | 'baseState' | 'catchUp' | 'initialize' | 'show' | 'settle'

export type LoaderFailure = 'unsupported' | 'unreadableUpdate' | 'editorFailed' | BootstrapFailure

/** What the page has of the document so far, for the header and the hooks that follow the session and the editor */
type Opened = {
  node?: NodeEntity
  role?: DocumentRole
  session?: Session
  /** Once the editor holds the base state */
  editorInvoker?: EditorInvoker
}

export type LoaderStatus =
  | ({ name: 'loading'; step: LoaderStep } & Opened)
  /** The session stopped before the Reveal Point; the run waits in its step for a retry */
  | ({ name: 'stopped'; step: LoaderStep; retryable: boolean } & Opened)
  | { name: 'revealed'; node: NodeEntity; role: DocumentRole; session: Session; editorInvoker: EditorInvoker }
  /** In the trash: RTS refuses a trashed document a token, so no session opens until it is restored */
  | { name: 'trashed'; node: NodeEntity; role: DocumentRole }
  /** A failed editor leaves its session open, so the edits it sent are still delivered */
  | { name: 'failed'; reason: LoaderFailure; session?: Session }

export type LoaderDeps = {
  client: Pick<ReturnType<typeof useRealtimeClient>, 'createSession'>
  drive: Pick<ReturnType<typeof getDrive>, 'getNodeHierarchy'>
  nodeMeta: PrivateNodeMeta
  logger: LoggerInterface
  appVersion: string
  /** Gives the editor the theme, the user's settings and name, sent before it is initialized; never throws */
  sendEditorBasics: (editorInvoker: EditorInvoker) => void
  /** Stable, so that the bridge built with them is built once */
  bridgeHandlers: Omit<
    ClientHandlerDependencies,
    'editorFrame' | 'sendUpdate' | 'onEditorError' | 'onEditorRendered'
  > & {
    /** An edit of the user's, once the session has it */
    onUpdateSent: (update: Uint8Array<ArrayBuffer>) => void
  }
}

export type LoaderIO = {
  /** The editor frame, booting since the route mounted */
  frame: Promise<HTMLIFrameElement>
  dispatch: (status: LoaderStatus) => void
  signal: AbortSignal
}

/**
 * Opens the text document `deps.nodeMeta`, one step after the other, each awaiting the one before
 * (`documentation/specs/doc2-loader.md` in the realtime repo). After the Reveal Point it keeps the editor in sync with
 * the session until `io.signal` aborts or the editor fails. Never rejects: a step that throws ends the run as `failed`.
 */
export async function loadDocument(deps: LoaderDeps, io: LoaderIO): Promise<void> {
  clearLoaderMeasures()
  const run = new LoaderRun(deps, io)
  try {
    const { node, role } = await run.step('node', () => run.readNode())
    if (node.trashTime) {
      run.openTrashed(node, role)
      return
    }
    await run.step('bootstrap', () => run.bootstrap())
    const editorInvoker = await run.step('frame', () => run.buildBridge(io.frame))
    await run.step('baseState', () => run.sendBaseState(editorInvoker))
    await run.step('catchUp', () => run.catchUp())
    await run.step('initialize', () => run.initializeEditor())
    await run.step('show', () => run.showEditor())
    await run.step('settle', () => run.settle())
    run.reveal()
    await run.keepInSync()
  } catch (error) {
    run.fail(error)
  }
}

/** A failure the Loader names itself, rather than reading it from where it was thrown */
class LoaderFailureError extends Error {
  constructor(readonly reason: LoaderFailure) {
    super(`Document load failed: ${reason}`)
  }
}

const STEP_MARKS: Partial<Record<LoaderStep, DocsLoadMarkName>> = {
  bootstrap: DocsLoadMark.DocumentLoaded,
  baseState: DocsLoadMark.BaseStateSent,
  catchUp: DocsLoadMark.CaughtUp,
  show: DocsLoadMark.EditorShown,
}

/** Before these steps' ends a thrown error is Drive's or the Docs API's; from `frame` on it is the editor's */
const OPENING_STEPS: LoaderStep[] = ['node', 'bootstrap']

class LoaderRun {
  private currentStep: LoaderStep = 'node'
  private node?: NodeEntity
  private role?: DocumentRole
  private session?: Session
  private editorInvoker?: EditorInvoker
  private editorShown = false
  private editorRendered = false
  private editRefused = false
  private revealed = false
  /** Set by `settle`: no lock call reaches the editor before it is shown */
  private lockStarted = false
  /** Set by a failure: the run dispatches nothing more, and calls the editor no more */
  private failed = false
  /** The latest lock call, from `settle` on */
  private lockCall?: LockCall
  private lastDispatched?: LoaderStatus
  /** Removed when the run ends, by an abort or a failure */
  private listeners: (() => void)[] = []
  private waiters = new Set<() => void>()
  /** Rejects when the signal aborts or the editor fails, ending whatever step awaits it */
  private readonly ended: Promise<never>
  private endRun: (reason: unknown) => void = () => {}

  constructor(
    private readonly deps: LoaderDeps,
    private readonly io: LoaderIO,
  ) {
    this.ended = new Promise<never>((_, reject) => (this.endRun = reject))
    this.ended.catch(() => {})
    this.whenAborted(() => {
      this.endRun(io.signal.reason)
      this.removeListeners()
    })
  }

  /**
   * Runs one step: dispatches it, awaits `fn` or the run's end, then measures it as `docs-loader:<name>`, places its
   * mark and logs it. After an abort it does none of these.
   */
  async step<T>(name: LoaderStep, fn: () => Promise<T>): Promise<T> {
    this.io.signal.throwIfAborted()
    this.currentStep = name
    this.publish()
    const start = now()
    try {
      const result = await Promise.race([fn(), this.ended])
      this.io.signal.throwIfAborted()
      const mark = STEP_MARKS[name]
      if (mark) {
        markDocsLoad(mark)
      }
      this.deps.logger.info('Document load step done', { step: name, durationMs: measureStep(name, start) })
      return result
    } catch (error) {
      if (!this.io.signal.aborted) {
        this.deps.logger.error(
          'Document load step failed',
          { step: name, durationMs: measureStep(name, start) },
          error as Error,
        )
      }
      throw error
    }
  }

  /** The node is the last item of its hierarchy, so one read gives both it and the user's role */
  async readNode(): Promise<{ node: NodeEntity; role: DocumentRole }> {
    const nodeUid = this.nodeUid()
    const hierarchy = await this.deps.drive.getNodeHierarchy(nodeUid)
    const node = hierarchy.at(-1)
    if (node?.uid !== nodeUid) {
      throw new Error('The node hierarchy does not end with the document')
    }
    if (!isProtonDocsDocument(node.mediaType ?? '')) {
      this.deps.logger.info('Node is not a text document', { mediaType: node.mediaType })
      throw new LoaderFailureError('unsupported')
    }
    this.node = node
    this.role = getDocumentRole(hierarchy)
    return { node, role: this.role }
  }

  openTrashed(node: NodeEntity, role: DocumentRole) {
    this.deps.logger.info('Document is in trash, opening no session')
    this.dispatch({ name: 'trashed', node, role })
  }

  /**
   * A base state with an unreadable update fails, since showing the rest would pass an incomplete document as whole.
   * The session is disconnected when the run is aborted, once bootstrapped if it was still bootstrapping.
   */
  async bootstrap(): Promise<void> {
    const { client, nodeMeta, logger } = this.deps
    const pending = client.createSession({
      documentType: 'doc',
      nodeMeta,
      // As /doc squashes on dev and black. Mirrors `packages/docs-core/lib/Types/SquashingConstants.ts`, its
      // `GetCommitDULimit`.
      ...(isDevOrBlack() && { commitDuLimit: 50 }),
    })
    const unreadableBaseStateUuids: string[] = []
    this.listen(
      pending.on('updateUnreadable', ({ uuid, origin }) => {
        if (origin === 'baseState') {
          logger.error('Base state DU could not be read', { uuid, origin })
          unreadableBaseStateUuids.push(uuid)
          return
        }
        logger.warn('Live DU could not be read', { uuid, origin })
      }),
    )

    const session = await pending.bootstrap()
    if (this.io.signal.aborted || unreadableBaseStateUuids.length > 0) {
      this.disconnect(session)
      this.io.signal.throwIfAborted()
      throw new LoaderFailureError('unreadableUpdate')
    }
    this.whenAborted(() => this.disconnect(session))
    this.session = session
    this.listen(session.subscribe(() => this.onSessionChange()))
    this.listen(
      session.on('refusal', () => {
        this.editRefused = true
        this.syncLock()
      }),
    )
    this.listen(this.rereadRoleAfterRebootstraps(session))
  }

  /** Builds the bridge once the frame is there, within EDITOR_FRAME_READY_TIMEOUT_MS of this step's start */
  async buildBridge(frame: Promise<HTMLIFrameElement>): Promise<EditorInvoker> {
    const editorFrame = await within(frame, EDITOR_FRAME_READY_TIMEOUT_MS, this.io.signal)
    const session = this.requireSession()
    const { onUpdateSent, ...handlers } = this.deps.bridgeHandlers
    const bridge = new ClientEditorBridge(
      editorFrame,
      createClientHandler({
        ...handlers,
        editorFrame,
        sendUpdate: (update) => {
          session.sendUpdate(update)
          onUpdateSent(update)
        },
        onEditorError: (error) => this.failEditor(error),
        onEditorRendered: () => {
          this.editorRendered = true
          this.markIfEditable()
          this.notify()
        },
      }),
      this.deps.logger,
    )
    this.listen(() => bridge.destroy())
    return bridge.editorInvoker
  }

  /** Sends the base state, then forwards what the session receives, so the editor gets updates after it, in order */
  async sendBaseState(editorInvoker: EditorInvoker): Promise<void> {
    const session = this.requireSession()
    // One at a time, so each update gets the invoker's whole timeout rather than sharing it with the rest
    for (const { content } of session.getBaseState().updates) {
      await editorInvoker.receiveMessage({ type: { wrapper: 'du' }, content, origin: DocUpdateOrigin.BaseCommit })
    }
    this.io.signal.throwIfAborted()

    const sendToEditor = (content: Uint8Array<ArrayBuffer>, origin?: DocUpdateOrigin) => {
      editorInvoker
        .receiveMessage({ type: { wrapper: 'du' }, content, origin })
        .catch((error) => this.failEditor(error))
    }
    this.listen(session.on('update', ({ content }) => sendToEditor(content)))
    this.listen(
      session.on('baseStateReplaced', ({ base }) => {
        this.deps.logger.info('Merging a replaced base state into the editor', { updates: base.updates.length })
        base.updates.forEach(({ content }) => sendToEditor(content, DocUpdateOrigin.BaseCommit))
      }),
    )
    this.editorInvoker = editorInvoker
  }

  /**
   * As docs-core's EditorController, waits for RTS to replay the edits it has not committed yet: before that the
   * editor may hold nothing. A connect that rejects has stopped the session, which the status shows.
   */
  async catchUp(): Promise<void> {
    const session = this.requireSession()
    session.connect().catch((error) => {
      if (!this.io.signal.aborted) {
        this.deps.logger.error('Failed to connect the document session', error)
      }
    })
    await this.until(() => session.getSnapshot().caughtUp)
  }

  /**
   * Initializes the editor for the user's role with the updates it holds. A viewer's read-only preview copies the
   * editor's content as it initializes and throws on an empty one (Lexical #38), so only once it holds the whole
   * document.
   */
  async initializeEditor(): Promise<void> {
    const editorInvoker = this.requireEditorInvoker()
    this.deps.sendEditorBasics(editorInvoker)
    const { userOwnAddress } = this.requireSession().getNodeMeta()
    await editorInvoker.initializeEditor(
      GenerateUUID(),
      userOwnAddress,
      this.requireRole(),
      false,
      this.deps.appVersion,
    )
  }

  /** Shows the editor, still locked, and has it broadcast its presence so peers see the user at once */
  async showEditor(): Promise<void> {
    const editorInvoker = this.requireEditorInvoker()
    await editorInvoker.showEditor()
    this.editorShown = true
    editorInvoker.broadcastPresenceState().catch((error) => {
      if (!this.io.signal.aborted) {
        this.deps.logger.warn('Failed to have the editor broadcast its presence', error)
      }
    })
  }

  /**
   * Starts the lock, and waits until the editor rendered its Lexical editor (its first `updateFrameSize`) and answered
   * the latest lock call, a lock or an unlock, with the session not stopped
   */
  async settle(): Promise<void> {
    this.lockStarted = true
    this.syncLock(true)
    const session = this.requireSession()
    await this.until(() =>
      isRevealPoint({
        editorShown: this.editorShown,
        editorRendered: this.editorRendered,
        lockCall: this.lockCall,
        sessionStatus: session.getSnapshot().status,
      }),
    )
  }

  /** The Reveal Point: the Loading Screen lifts, and stays lifted whatever the session does next */
  reveal() {
    this.revealed = true
    markDocsLoad(DocsLoadMark.Revealed)
    this.publish()
  }

  /** Keeps the editor in sync with the session, through the listeners the steps added, until the run ends */
  async keepInSync(): Promise<never> {
    return this.ended
  }

  fail(error: unknown) {
    if (this.io.signal.aborted) {
      return
    }
    const reason = this.failureReason(error)
    this.failed = true
    const session = reason === 'editorFailed' ? this.session : undefined
    this.removeListeners()
    if (this.revealed) {
      this.deps.logger.error('Failed to keep the document in the editor', error as Error)
    }
    // A failed editor is gone, so peers must stop seeing its last cursor, which the session would keep broadcasting
    session?.setPresence(null)
    this.dispatch({ name: 'failed', reason, session })
  }

  private failureReason(error: unknown): LoaderFailure {
    if (error instanceof LoaderFailureError) {
      return error.reason
    }
    return OPENING_STEPS.includes(this.currentStep) ? classifyBootstrapError(error) : 'editorFailed'
  }

  private failEditor(error: Error) {
    this.endRun(error)
  }

  private onSessionChange() {
    this.syncLock()
    this.publish()
    this.notify()
  }

  /**
   * The lock follows `isLocked` from `settle` on: a change calls the editor again, and `force` calls it with an
   * unchanged lock, as after the role is read again. Only the answer to the latest call counts.
   */
  private syncLock(force = false) {
    const { editorInvoker, session, role } = this
    if (!this.lockStarted || this.failed || !editorInvoker || !session || !role) {
      return
    }
    const locked = isLocked({ snapshot: session.getSnapshot(), role, editRefused: this.editRefused })
    if (!force && this.lockCall?.locked === locked) {
      return
    }

    const call = { locked, answered: false }
    this.lockCall = call
    editorInvoker.changeLockedState(locked).then(
      () => {
        if (this.lockCall !== call || this.failed || this.io.signal.aborted) {
          return
        }
        call.answered = true
        this.markIfEditable()
        this.notify()
      },
      (error) => this.failEditor(error),
    )
  }

  /** `docs-load:editor-editable`: the editor shown and rendered, and its answer to the latest lock call an unlock */
  private markIfEditable() {
    if (this.editorShown && this.editorRendered && this.lockCall?.answered && !this.lockCall.locked) {
      markDocsLoad(DocsLoadMark.EditorEditable)
    }
  }

  /**
   * The SDK rebootstraps when the user's access changes, so the role is read again each time the status leaves
   * `opening`. Only the latest read counts, and one that fails keeps the role. A read applies the lock again even when
   * the role is unchanged.
   */
  private rereadRoleAfterRebootstraps(session: Session): () => void {
    let rebootstrapping = session.getSnapshot().status.name === 'opening'
    let latestRead = 0

    return session.subscribe(({ status }) => {
      if (status.name === 'opening') {
        rebootstrapping = true
        return
      }
      if (!rebootstrapping) {
        return
      }
      rebootstrapping = false
      const read = ++latestRead
      this.deps.drive.getNodeHierarchy(this.nodeUid()).then(
        (hierarchy) => {
          if (this.io.signal.aborted || read !== latestRead) {
            return
          }
          this.role = getDocumentRole(hierarchy)
          this.deps.logger.info('Read the role again after a rebootstrap', { role: this.role })
          this.publish()
          this.syncLock(true)
        },
        (error) => {
          if (!this.io.signal.aborted) {
            this.deps.logger.warn('Failed to read the role again after a rebootstrap', error)
          }
        },
      )
    })
  }

  private publish() {
    if (this.failed) {
      return
    }
    const status = this.status()
    const last = this.lastDispatched
    if (last && shallowEqual(last, status)) {
      return
    }
    this.dispatch(status)
  }

  private status(): LoaderStatus {
    const { node, role, session, editorInvoker } = this
    if (this.revealed && node && role && session && editorInvoker) {
      return { name: 'revealed', node, role, session, editorInvoker }
    }
    const opened = { node, role, session, editorInvoker }
    const status = session?.getSnapshot().status
    return status?.name === 'stopped'
      ? { name: 'stopped', step: this.currentStep, retryable: status.retryable, ...opened }
      : { name: 'loading', step: this.currentStep, ...opened }
  }

  private dispatch(status: LoaderStatus) {
    if (this.io.signal.aborted) {
      return
    }
    this.lastDispatched = status
    this.io.dispatch(status)
  }

  /** Resolves once `condition` holds, checked now and on every change the run is told of */
  private until(condition: () => boolean): Promise<void> {
    return new Promise((resolve) => {
      const check = () => {
        if (condition()) {
          this.waiters.delete(check)
          resolve()
        }
      }
      this.waiters.add(check)
      check()
    })
  }

  private notify() {
    this.waiters.forEach((check) => check())
  }

  private listen(removeListener: () => void) {
    if (this.io.signal.aborted) {
      removeListener()
      return
    }
    this.listeners.push(removeListener)
  }

  private removeListeners() {
    this.listeners.splice(0).forEach((removeListener) => removeListener())
    this.waiters.clear()
  }

  /** Runs `fn` when the signal aborts, or at once if it has */
  private whenAborted(fn: () => void) {
    if (this.io.signal.aborted) {
      fn()
      return
    }
    this.io.signal.addEventListener('abort', fn, { once: true })
  }

  private disconnect(session: Session) {
    session.disconnect().catch((error) => this.deps.logger.warn('Failed to disconnect the document session', error))
  }

  private nodeUid() {
    return generateNodeUid(this.deps.nodeMeta.volumeId, this.deps.nodeMeta.linkId)
  }

  private requireSession(): Session {
    if (!this.session) {
      throw new Error('No session before the bootstrap step')
    }
    return this.session
  }

  private requireEditorInvoker(): EditorInvoker {
    if (!this.editorInvoker) {
      throw new Error('No editor before the base state step')
    }
    return this.editorInvoker
  }

  private requireRole(): DocumentRole {
    if (!this.role) {
      throw new Error('No role before the node step')
    }
    return this.role
  }
}

/** Resolves with `promise`, or rejects once `ms` pass first, or at once on abort, so nothing builds on a late frame */
function within<T>(promise: Promise<T>, ms: number, signal: AbortSignal): Promise<T> {
  return new Promise((resolve, reject) => {
    signal.throwIfAborted()
    const timeout = setTimeout(() => reject(new Error(`Editor frame was not ready within ${ms} ms`)), ms)
    signal.addEventListener(
      'abort',
      () => {
        clearTimeout(timeout)
        reject(signal.reason)
      },
      { once: true },
    )
    promise.then(
      (value) => {
        clearTimeout(timeout)
        resolve(value)
      },
      (error) => {
        clearTimeout(timeout)
        reject(error)
      },
    )
  })
}

function now(): number | undefined {
  try {
    return performance.now()
  } catch {
    return undefined
  }
}

/** One `docs-loader:<step>` measure per step on the page's time line: a retry remount's run replaces the last one's */
function clearLoaderMeasures() {
  try {
    performance
      .getEntriesByType('measure')
      .filter(({ name }) => name.startsWith(LOADER_MEASURE_PREFIX))
      .forEach(({ name }) => performance.clearMeasures(name))
  } catch {
    // No User Timing: nothing to clear
  }
}

/** Places the measure `docs-loader:<step>` from `start` to now and returns its duration; skipped, never thrown */
function measureStep(step: LoaderStep, start: number | undefined): number | undefined {
  if (start === undefined) {
    return undefined
  }
  try {
    return performance.measure(`${LOADER_MEASURE_PREFIX}${step}`, { start, end: performance.now() }).duration
  } catch {
    // No User Timing: the load goes on without the measure
    return undefined
  }
}

function shallowEqual(a: object, b: object): boolean {
  const aEntries = Object.entries(a)
  return (
    aEntries.length === Object.keys(b).length &&
    aEntries.every(([key, value]) => (b as Record<string, unknown>)[key] === value)
  )
}
