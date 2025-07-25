import { AuthenticatedDocController } from '../../AuthenticatedDocController/AuthenticatedDocController'
import { CommentController } from '../Comments/CommentController'
import type { DocumentState } from '../../State/DocumentState'
import { EditorController } from '../../EditorController/EditorController'
import { EditorOrchestrator } from '../Orchestrator/EditorOrchestrator'
import { metricsBucketNumberForUpdateCount } from '../../Util/bucketNumberForUpdateCount'
import { RealtimeController } from '../../RealtimeController/RealtimeController'
import metrics from '@proton/metrics'
import type { AuthenticatedDocControllerInterface } from '../../AuthenticatedDocController/AuthenticatedDocControllerInterface'
import type { CreateComment } from '../../UseCase/CreateComment'
import type { CreateNewDocument } from '../../UseCase/CreateNewDocument'
import type { CreateThread } from '../../UseCase/CreateThread'
import type { DocLoaderInterface } from './DocLoaderInterface'
import type { DocLoaderStatusObserver } from './StatusObserver'
import type { DocsApi } from '../../Api/DocsApi'
import type { DriveCompat, NodeMeta } from '@proton/drive-store'
import type { DuplicateDocument } from '../../UseCase/DuplicateDocument'
import type { EditorControllerInterface } from '../../EditorController/EditorController'
import type { EditorOrchestratorInterface } from '../Orchestrator/EditorOrchestratorInterface'
import type { EncryptComment } from '../../UseCase/EncryptComment'
import type { ExportAndDownload } from '../../UseCase/ExportAndDownload'
import type { GetDocumentMeta } from '../../UseCase/GetDocumentMeta'
import type { GetNode } from './../../UseCase/GetNode'
import type { HandleRealtimeCommentsEvent } from '../../UseCase/HandleRealtimeCommentsEvent'
import { type InternalEventBusInterface, type CommentControllerInterface } from '@proton/docs-shared'
import type { FetchDecryptedCommit } from '../../UseCase/FetchDecryptedCommit'
import type { LoadDocument } from '../../UseCase/LoadDocument'
import type { LoadThreads } from '../../UseCase/LoadThreads'
import type { LoggerInterface } from '@proton/utils/logs'
import type { MetricService } from '../Metrics/MetricService'
import type { SeedInitialCommit } from '../../UseCase/SeedInitialCommit'
import type { SquashDocument } from '../../UseCase/SquashDocument'
import type { WebsocketServiceInterface } from '../Websockets/WebsocketServiceInterface'
import { PrivateRenameController, type RenameControllerInterface } from '../../RenameController/RenameController'
import { redirectToCorrectDocTypeIfNeeded } from '../../Util/redirect-to-correct-doc-type'
import type { UnleashClient } from '@proton/unleash'
import type { DocumentType } from '@proton/drive-store/store/_documents'

export class DocLoader implements DocLoaderInterface<DocumentState> {
  private docController?: AuthenticatedDocControllerInterface
  private editorController?: EditorControllerInterface
  private commentsController?: CommentControllerInterface
  private renameController?: RenameControllerInterface
  private orchestrator?: EditorOrchestratorInterface
  private documentState?: DocumentState
  private readonly statusObservers: DocLoaderStatusObserver<DocumentState>[] = []

  constructor(
    private websocketService: WebsocketServiceInterface,
    private driveCompat: DriveCompat,
    private metricService: MetricService,
    private docsApi: DocsApi,
    private squashDoc: SquashDocument,
    private createInitialCommit: SeedInitialCommit,
    private loadDocument: LoadDocument,
    private loadCommit: FetchDecryptedCommit,
    private encryptComment: EncryptComment,
    private createComment: CreateComment,
    private createThread: CreateThread,
    private loadThreads: LoadThreads,
    private handleRealtimeCommentsEvent: HandleRealtimeCommentsEvent,
    private duplicateDocument: DuplicateDocument,
    private createNewDocument: CreateNewDocument,
    private getDocumentMeta: GetDocumentMeta,
    private exportAndDownload: ExportAndDownload,
    private getNode: GetNode,
    private eventBus: InternalEventBusInterface,
    private logger: LoggerInterface,
    private unleashClient: UnleashClient,
  ) {}

  destroy(): void {
    this.docController?.destroy()
  }

  public async initialize(nodeMeta: NodeMeta, documentType: DocumentType): Promise<void> {
    if (this.docController) {
      throw new Error('[DocLoader] docController already initialized')
    }

    const startTime = Date.now()

    const loadResult = await this.loadDocument.executePrivate(nodeMeta)
    if (loadResult.isFailed()) {
      this.logger.error('Failed to load private document', loadResult.getErrorObject())
      this.statusObservers.forEach((observer) => {
        observer.onError(loadResult.getErrorObject().message, loadResult.getErrorObject().code)
      })
      return
    }

    const { documentState } = loadResult.getValue()
    this.logger.info(
      `Loaded document meta with last commit id ${documentState.getProperty('documentMeta').latestCommitId()}`,
    )

    const node = documentState.getProperty('decryptedNode')
    const mimeType = node.mimeType

    redirectToCorrectDocTypeIfNeeded(mimeType, this.docsApi)

    this.documentState = documentState

    const editorController = new EditorController(this.logger, this.exportAndDownload, documentState, this.eventBus)
    this.editorController = editorController

    const controller = new AuthenticatedDocController(
      documentState,
      this.driveCompat,
      this.squashDoc,
      this.createInitialCommit,
      this.duplicateDocument,
      this.createNewDocument,
      this.getNode,
      this.eventBus,
      this.logger,
    )

    this.docController = controller

    const realtime = new RealtimeController(
      this.websocketService,
      this.eventBus,
      documentState,
      this.loadCommit,
      this.getDocumentMeta,
      this.logger,
      this.unleashClient,
      documentType,
    )
    realtime.initializeConnection()

    this.commentsController = new CommentController(
      documentState,
      this.websocketService,
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

    this.orchestrator = new EditorOrchestrator(
      this.commentsController,
      this.docsApi,
      this.eventBus,
      this.editorController,
      documentState,
    )

    this.renameController = new PrivateRenameController(documentState, this.driveCompat, this.getNode, this.logger)

    this.statusObservers.forEach((observer) => {
      if (this.orchestrator) {
        observer.onSuccess({
          orchestrator: this.orchestrator,
          documentState,
          docController: controller,
          editorController: editorController,
          renameController: this.renameController,
        })
      }
    })

    this.commentsController.fetchAllComments()

    const endTime = Date.now()
    const timeToLoadInSeconds = (endTime - startTime) / 1000
    metrics.docs_time_load_document_histogram.observe({
      Labels: {
        updates: metricsBucketNumberForUpdateCount(documentState.getProperty('baseCommit')?.numberOfMessages() ?? 0),
      },
      Value: timeToLoadInSeconds,
    })

    this.logger.info(`Loaded document in ${timeToLoadInSeconds} seconds`)
  }

  public addStatusObserver(observer: DocLoaderStatusObserver<DocumentState>): () => void {
    this.statusObservers.push(observer)

    if (this.orchestrator && this.docController && this.editorController && this.documentState) {
      observer.onSuccess({
        orchestrator: this.orchestrator,
        documentState: this.documentState,
        docController: this.docController,
        editorController: this.editorController,
        renameController: this.renameController,
      })
    }

    return () => {
      this.statusObservers.splice(this.statusObservers.indexOf(observer), 1)
    }
  }
}
