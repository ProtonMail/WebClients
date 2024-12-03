import { CommentController } from '../Comments/CommentController'
import { DocumentState, PublicDocumentState } from '../../State/DocumentState'
import { EditorController } from '../../EditorController/EditorController'
import { EditorOrchestrator } from '../Orchestrator/EditorOrchestrator'
import { RealtimeController } from '../../RealtimeController/RealtimeController'
import { AnonymousUserDisplayName, type InternalEventBusInterface, type SyncedEditorState } from '@proton/docs-shared'
import type { CommentControllerInterface } from '@proton/docs-shared'
import type { CreateComment } from '../../UseCase/CreateComment'
import type { CreateThread } from '../../UseCase/CreateThread'
import type { DocLoaderInterface } from './DocLoaderInterface'
import type { DocLoaderStatusObserver } from './StatusObserver'
import type { DocsApi } from '../../Api/DocsApi'
import type { EditorControllerInterface } from '../../EditorController/EditorController'
import type { EditorOrchestratorInterface } from '../Orchestrator/EditorOrchestratorInterface'
import type { EncryptComment } from '../../UseCase/EncryptComment'
import type { ExportAndDownload } from '../../UseCase/ExportAndDownload'
import type { FeatureFlag, UnleashClient } from '@proton/unleash'
import type { GetDocumentMeta } from '../../UseCase/GetDocumentMeta'
import type { HandleRealtimeCommentsEvent } from '../../UseCase/HandleRealtimeCommentsEvent'
import type { LoadCommit } from '../../UseCase/LoadCommit'
import type { LoadDocument } from '../../UseCase/LoadDocument'
import type { LoadThreads } from '../../UseCase/LoadThreads'
import type { LoggerInterface } from '@proton/utils/logs'
import type { MetricService } from '../Metrics/MetricService'
import type { PublicDriveCompat, PublicNodeMeta } from '@proton/drive-store'
import type { WebsocketServiceInterface } from '../Websockets/WebsocketServiceInterface'

export class PublicDocLoader implements DocLoaderInterface<PublicDocumentState> {
  private editorController?: EditorControllerInterface
  private orchestrator?: EditorOrchestratorInterface
  private documentState?: PublicDocumentState
  private commentsController?: CommentControllerInterface
  private readonly statusObservers: DocLoaderStatusObserver<PublicDocumentState>[] = []

  constructor(
    private driveCompat: PublicDriveCompat,
    private websocketSerivce: WebsocketServiceInterface,
    private docsApi: DocsApi,
    private loadDocument: LoadDocument,
    private exportAndDownload: ExportAndDownload,
    private eventBus: InternalEventBusInterface,
    private loadCommit: LoadCommit,
    private getDocumentMeta: GetDocumentMeta,
    private logger: LoggerInterface,
    private unleashClient: UnleashClient,
    private syncedEditorState: SyncedEditorState,
    private encryptComment: EncryptComment,
    private createComment: CreateComment,
    private createThread: CreateThread,
    private loadThreads: LoadThreads,
    private handleRealtimeCommentsEvent: HandleRealtimeCommentsEvent,
    private metricService: MetricService,
  ) {}

  destroy(): void {}

  publicEditingEnabled(): boolean {
    if (!this.unleashClient.isReady()) {
      console.warn('Attempting to read public editing flag before unleash is ready')
      return false
    }

    const docsFlag: FeatureFlag = 'DocsPublicEditing'

    return this.unleashClient.isEnabled(docsFlag)
  }

  public async initialize(nodeMeta: PublicNodeMeta): Promise<void> {
    const publicEditingEnabled = this.publicEditingEnabled()

    const loadResult = await this.loadDocument.executePublic(nodeMeta, publicEditingEnabled)
    if (loadResult.isFailed()) {
      this.logger.error('Failed to load document', loadResult.getError())
      this.statusObservers.forEach((observer) => {
        observer.onError(loadResult.getError())
      })
      return
    }

    const { entitlements, meta: docMeta, node, decryptedCommit } = loadResult.getValue()
    this.logger.info(`Loaded document meta with last commit id ${docMeta.latestCommitId()}`)

    this.syncedEditorState.setProperty('userName', AnonymousUserDisplayName)

    const documentState = new PublicDocumentState({
      ...DocumentState.defaults,
      realtimeEnabled: publicEditingEnabled,
      documentMeta: docMeta,
      userRole: entitlements.role,
      decryptedNode: node,
      entitlements,
      documentName: docMeta.name,
      currentCommitId: docMeta.latestCommitId(),
      baseCommit: decryptedCommit,
      documentTrashState: node.trashed ? 'trashed' : 'not_trashed',
    })
    this.documentState = documentState

    const editorController = new EditorController(this.logger, this.exportAndDownload, this.documentState)
    this.editorController = editorController

    if (publicEditingEnabled) {
      const realtime = new RealtimeController(
        this.websocketSerivce,
        this.eventBus,
        documentState,
        this.loadCommit,
        this.getDocumentMeta,
        this.logger,
      )

      realtime.initializeConnection()

      this.commentsController = new CommentController(
        undefined,
        documentState,
        this.websocketSerivce,
        this.metricService,
        this.docsApi,
        this.encryptComment,
        this.createThread,
        this.createComment,
        this.loadThreads,
        this.handleRealtimeCommentsEvent,
        this.eventBus,
        this.logger,
      )

      this.commentsController.fetchAllComments()
    }

    if (entitlements.role.isPublicViewerWithAccess()) {
      this.logger.info('Redirecting to authed document')
      this.driveCompat.redirectToAuthedDocument({
        volumeId: docMeta.volumeId,
        linkId: nodeMeta.linkId,
      })
      return
    }

    this.orchestrator = new EditorOrchestrator(
      this.commentsController,
      this.docsApi,
      this.eventBus,
      this.editorController,
      this.documentState,
    )

    this.statusObservers.forEach((observer) => {
      if (this.orchestrator) {
        observer.onSuccess({
          orchestrator: this.orchestrator,
          documentState: documentState,
          editorController: editorController,
        })
      }
    })
  }

  public addStatusObserver(observer: DocLoaderStatusObserver<PublicDocumentState>): () => void {
    this.statusObservers.push(observer)

    if (this.orchestrator && this.documentState && this.editorController) {
      observer.onSuccess({
        orchestrator: this.orchestrator,
        documentState: this.documentState,
        editorController: this.editorController,
      })
    }

    return () => {
      this.statusObservers.splice(this.statusObservers.indexOf(observer), 1)
    }
  }
}
