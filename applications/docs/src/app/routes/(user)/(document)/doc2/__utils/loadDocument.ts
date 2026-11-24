import { AnonymousUserEmail } from '@proton/docs-shared/AnonymousUser'
import { DocUpdateOrigin } from '@proton/docs-shared/Doc/DocState'
import { GenerateUUID } from '@proton/docs-shared/GenerateUuid'
import { type NodeEntity, generateNodeUid, type getDrive, splitNodeUid } from '@proton/drive/sdk'
import { isDevOrBlack } from '@proton/shared/lib/env'
import { isProtonDocsDocument } from '@proton/shared/lib/helpers/mimetype'
import type { LoggerInterface } from '@proton/shared/lib/logs'
import type {
  PendingPublicSession,
  PendingSession,
  PrivateNodeMeta,
  PublicNodeMeta,
  PublicRealtimeClient,
  PublicSession,
  Session,
} from '@proton-docs/realtime-sdk'

import { ClientEditorBridge } from './ClientEditorBridge'
import type { EditorInvoker } from './EditorInvoker'
import { type BootstrapFailure, classifyBootstrapError } from './classifyBootstrapError'
import { pushCommentsToEditor } from './comments/pushCommentsToEditor'
import { type ClientHandlerDependencies, createClientHandler } from './createClientHandler'
import { type DocumentRole, getDocumentRole } from './getDocumentRole'
import { DocsLoadMark, type DocsLoadMarkName, markDocsLoad } from './loadMarks'
import { type LockCall, isLocked, isRevealPoint } from './loadingScreen'
import { getPublicDocumentRole } from './publicLink'
import type { useRealtimeClient } from './useRealtimeClient'

export const EDITOR_FRAME_READY_TIMEOUT_MS = 30_000

/** The prefix of each step's measure on the page's time line, `docs-loader:<step>` */
const LOADER_MEASURE_PREFIX = 'docs-loader:'

/** The Loader's steps, in the order it runs them */
export type LoaderStep = 'node' | 'bootstrap' | 'frame' | 'baseState' | 'catchUp' | 'initialize' | 'show' | 'settle'

export type LoaderFailure = 'unsupported' | 'unreadableUpdate' | 'editorFailed' | BootstrapFailure

/** A member's session, or a visitor's at a share link, which has no squash */
export type DocumentSession = Session | PublicSession

/** The session's comments, when on: a public session has none, as public links have no comments yet */
export function commentsOf(session: DocumentSession | undefined): Session['comments'] | undefined {
  return session && 'comments' in session ? session.comments : undefined
}

/** What the page has of the document so far, for the header and the hooks that follow the session and the editor */
type Opened = {
  node?: NodeEntity
  role?: DocumentRole
  session?: DocumentSession
  /** Once the editor holds the base state */
  editorInvoker?: EditorInvoker
}

export type LoaderStatus =
  | ({ name: 'loading'; step: LoaderStep } & Opened)
  /** The session stopped before the Reveal Point; the run waits in its step for a retry */
  | ({ name: 'stopped'; step: LoaderStep; retryable: boolean } & Opened)
  | {
      name: 'revealed'
      node: NodeEntity
      role: DocumentRole
      session: DocumentSession
      editorInvoker: EditorInvoker
      /** The SDK refused an edit, a lock cause the session's snapshot doesn't hold */
      editRefused: boolean
    }
  /** In the trash: RTS refuses a trashed document a token, so no session opens until it is restored */
  | { name: 'trashed'; node: NodeEntity; role: DocumentRole }
  /** A visitor with access of their own, sent to the document's private URL: no session opens */
  | { name: 'redirecting' }
  /** A failed editor leaves its session open, so the edits it sent are still delivered */
  | { name: 'failed'; reason: LoaderFailure; session?: DocumentSession }

/** A document the user reaches as a member */
export type PrivateLoaderDeps = LoaderCommonDeps & {
  client: Pick<ReturnType<typeof useRealtimeClient>, 'createSession' | 'prefetchBootstrap'>
  drive: Pick<ReturnType<typeof getDrive>, 'getNodeHierarchy'>
  nodeMeta: PrivateNodeMeta
  /** The document's name as it is now, for the comment notification emails */
  getDocumentName: () => string | undefined
  publicLink?: undefined
}

/** A document a visitor reaches through a share link, signed in or not (`documentation/specs/doc2-public-links.md`) */
export type PublicLinkLoaderDeps = {
  client: Pick<PublicRealtimeClient, 'createSession'>
  nodeMeta: PublicNodeMeta
  /** The share-URL client's node of the document */
  getNode: () => Promise<NodeEntity>
  /** Whether the link lets its visitors edit */
  isEditorLink: boolean
  /** `DocsPublicEditing`, read once Unleash is ready: off, the visitor views the latest commit and nothing connects */
  publicEditing: boolean
  /** Whether a signed-in visitor can reach the document as a member; always false for an anonymous one */
  hasAccessOfOwn: (node: NodeEntity) => Promise<boolean>
  /** Leaves for the document's private URL, `/doc2?mode=open` */
  openPrivately: (nodeMeta: PrivateNodeMeta) => void
}

export type LoaderDeps = PrivateLoaderDeps | (LoaderCommonDeps & { publicLink: PublicLinkLoaderDeps })

type LoaderCommonDeps = {
  logger: LoggerInterface
  appVersion: string
  /** Gives the editor the theme, the user's settings and name, sent before it is initialized; never throws */
  sendEditorBasics: (editorInvoker: EditorInvoker) => void
  /** Stable, so that the bridge built with them is built once */
  bridgeHandlers: Omit<
    ClientHandlerDependencies,
    'editorFrame' | 'sendUpdate' | 'onEditorError' | 'onEditorRendered' | 'comments'
  >
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
    const opened = await run.open()
    if (!opened) {
      return
    }
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
  private session?: DocumentSession
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

  /**
   * The `node` and `bootstrap` steps, with an Early Start: the SDK prefetches the bootstrap's Docs API reads beside the
   * node step, which they don't need, and the session's bootstrap takes them. Confirmed at once, so the realtime token
   * is fetched beside the node step too: a document in the trash then gets one refused token request, which costs less
   * than waiting for the node step on every open. Ended here too, for a run that opens no session. Resolves `false` for
   * a document in the trash, or a visitor sent to its private URL.
   */
  async open(): Promise<boolean> {
    const { deps } = this
    if (deps.publicLink) {
      return this.openPublicLink(deps.publicLink)
    }
    const prefetch = deps.client.prefetchBootstrap(deps.nodeMeta)
    prefetch.confirm()
    try {
      const { node, role } = await this.step('node', () => this.readNode(deps))
      if (node.trashTime) {
        this.openTrashed(node, role)
        return false
      }
      await this.step('bootstrap', () =>
        this.bootstrap(
          () =>
            deps.client.createSession({
              documentType: 'doc',
              nodeMeta: deps.nodeMeta,
              prefetch,
              // Comments are on for admins and editors only; /doc also shows a viewer the threads, read-only.
              ...((this.role === 'Admin' || this.role === 'Editor') && {
                comments: { getDocumentNameForEmails: deps.getDocumentName },
              }),
              // As /doc squashes on dev and black. Mirrors `packages/docs-core/lib/Types/SquashingConstants.ts`, its
              // `GetCommitDULimit`.
              ...(isDevOrBlack() && { commitDuLimit: 50 }),
            }),
          async () => getDocumentRole(await deps.drive.getNodeHierarchy(nodeUid(deps.nodeMeta))),
        ),
      )
      return true
    } finally {
      prefetch.end()
    }
  }

  /**
   * The `node` and `bootstrap` steps through a share link. No Early Start: every public read needs the share-URL
   * session first. Adapted from `packages/docs-core/lib/Services/DocumentLoader/PublicDocLoader.ts`, its redirect for
   * access of one's own, before any session opens.
   */
  async openPublicLink(link: PublicLinkLoaderDeps): Promise<boolean> {
    const { redirect } = await this.step('node', () => this.readPublicNode(link))
    if (redirect) {
      this.deps.logger.info('Visitor has access of their own, redirecting to the private document')
      this.dispatch({ name: 'redirecting' })
      link.openPrivately(redirect)
      return false
    }
    // The link's role is read once, from the share-URL sign-in, so a rebootstrap doesn't read it again
    await this.step('bootstrap', () =>
      this.bootstrap(() => link.client.createSession({ documentType: 'doc', nodeMeta: link.nodeMeta })),
    )
    return true
  }

  /** The node is the last item of its hierarchy, so one read gives both it and the user's role */
  async readNode(deps: PrivateLoaderDeps): Promise<{ node: NodeEntity; role: DocumentRole }> {
    const uid = nodeUid(deps.nodeMeta)
    const hierarchy = await deps.drive.getNodeHierarchy(uid)
    const node = hierarchy.at(-1)
    if (node?.uid !== uid) {
      throw new Error('The node hierarchy does not end with the document')
    }
    this.requireTextDocument(node)
    this.node = node
    this.role = getDocumentRole(hierarchy)
    return { node, role: this.role }
  }

  /** The share-URL client's node, and where a visitor with access of their own goes instead */
  async readPublicNode(link: PublicLinkLoaderDeps): Promise<{ redirect?: PrivateNodeMeta }> {
    const node = await link.getNode()
    this.requireTextDocument(node)
    if (await link.hasAccessOfOwn(node)) {
      const { volumeId, nodeId } = splitNodeUid(node.uid)
      return { redirect: { volumeId, linkId: nodeId } }
    }
    this.node = node
    this.role = getPublicDocumentRole(link)
    return {}
  }

  openTrashed(node: NodeEntity, role: DocumentRole) {
    this.deps.logger.info('Document is in trash, opening no session')
    this.dispatch({ name: 'trashed', node, role })
  }

  /**
   * A base state with an unreadable update fails, since showing the rest would pass an incomplete document as whole.
   * The session is disconnected when the run is aborted, once bootstrapped if it was still bootstrapping. `readRole`,
   * when given, reads the role again after each rebootstrap.
   */
  async bootstrap(
    createSession: () => PendingSession | PendingPublicSession,
    readRole?: () => Promise<DocumentRole>,
  ): Promise<void> {
    const { logger } = this.deps
    const pending = createSession()
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
        this.publish()
      }),
    )
    if (readRole) {
      this.listen(this.rereadRoleAfterRebootstraps(session, readRole))
    }
  }

  /** Builds the bridge once the frame is there, within EDITOR_FRAME_READY_TIMEOUT_MS of this step's start */
  async buildBridge(frame: Promise<HTMLIFrameElement>): Promise<EditorInvoker> {
    const editorFrame = await within(frame, EDITOR_FRAME_READY_TIMEOUT_MS, this.io.signal)
    const session = this.requireSession()
    const bridge = new ClientEditorBridge(
      editorFrame,
      createClientHandler({
        ...this.deps.bridgeHandlers,
        editorFrame,
        comments: commentsOf(session),
        sendUpdate: (update) => session.sendUpdate(update),
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
   * editor may hold nothing. A connect that rejects has stopped the session, which the status shows. A share link's
   * session with `DocsPublicEditing` off never connects: the base state is all there is.
   */
  async catchUp(): Promise<void> {
    const session = this.requireSession()
    if (this.deps.publicLink && !this.deps.publicLink.publicEditing) {
      this.deps.logger.info('Public editing is off, viewing the latest commit without connecting')
      return
    }
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
   * document. An anonymous visitor has no address: the editor gets /doc's anonymous one. Mirrors
   * `packages/docs-core/lib/Services/Orchestrator/EditorOrchestrator.ts`, its `userAddress`.
   */
  async initializeEditor(): Promise<void> {
    const editorInvoker = this.requireEditorInvoker()
    this.deps.sendEditorBasics(editorInvoker)
    const { userOwnAddress } = this.requireSession().getNodeMeta()
    await editorInvoker.initializeEditor(
      GenerateUUID(),
      userOwnAddress ?? AnonymousUserEmail,
      this.requireRole(),
      Boolean(this.deps.publicLink),
      this.deps.appVersion,
    )
    // Not before: the editor throws on a call before it is initialized, and reads the threads itself once it mounts
    const comments = commentsOf(this.requireSession())
    if (comments) {
      this.listen(pushCommentsToEditor(comments, editorInvoker, this.deps.logger))
    }
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
  private rereadRoleAfterRebootstraps(session: DocumentSession, readRole: () => Promise<DocumentRole>): () => void {
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
      readRole().then(
        (role) => {
          if (this.io.signal.aborted || read !== latestRead) {
            return
          }
          this.role = role
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
    const { node, role, session, editorInvoker, editRefused } = this
    if (this.revealed && node && role && session && editorInvoker) {
      return { name: 'revealed', node, role, session, editorInvoker, editRefused }
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

  private disconnect(session: DocumentSession) {
    session.disconnect().catch((error) => this.deps.logger.warn('Failed to disconnect the document session', error))
  }

  /** Only a text document opens: anything else is `unsupported` */
  private requireTextDocument(node: NodeEntity) {
    if (!isProtonDocsDocument(node.mediaType ?? '')) {
      this.deps.logger.info('Node is not a text document', { mediaType: node.mediaType })
      throw new LoaderFailureError('unsupported')
    }
  }

  private requireSession(): DocumentSession {
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

function nodeUid({ volumeId, linkId }: PrivateNodeMeta) {
  return generateNodeUid(volumeId, linkId)
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
