import type { GetNode } from './../../UseCase/GetNode'
import type { LoggerInterface } from '@proton/utils/logs'
import { DocController } from '../../Controller/Document/DocController'
import type { SquashDocument } from '../../UseCase/SquashDocument'
import type { InternalEventBusInterface, CommentControllerInterface } from '@proton/docs-shared'
import type { EncryptComment } from '../../UseCase/EncryptComment'
import type { DuplicateDocument } from '../../UseCase/DuplicateDocument'
import type { CreateNewDocument } from '../../UseCase/CreateNewDocument'
import { EditorOrchestrator } from '../Orchestrator/EditorOrchestrator'
import type { LoadDocument } from '../../UseCase/LoadDocument'
import type { SeedInitialCommit } from '../../UseCase/SeedInitialCommit'
import type { GetDocumentMeta } from '../../UseCase/GetDocumentMeta'
import type { DriveCompat, NodeMeta } from '@proton/drive-store'
import type { HandleRealtimeCommentsEvent } from '../../UseCase/HandleRealtimeCommentsEvent'
import type { CreateComment } from '../../UseCase/CreateComment'
import type { CreateThread } from '../../UseCase/CreateThread'
import type { LoadThreads } from '../../UseCase/LoadThreads'
import type { DocLoaderInterface } from './DocLoaderInterface'
import type { EditorOrchestratorInterface } from '../Orchestrator/EditorOrchestratorInterface'
import type { DocControllerInterface } from '../../Controller/Document/DocControllerInterface'
import { CommentController } from '../Comments/CommentController'
import type { WebsocketServiceInterface } from '../Websockets/WebsocketServiceInterface'
import type { LoadCommit } from '../../UseCase/LoadCommit'
import type { ExportAndDownload } from '../../UseCase/ExportAndDownload'
import type { DocsApi } from '../../Api/DocsApi'
import type { MetricService } from '../Metrics/MetricService'
import type { UnleashClient } from '@proton/unleash'

export type StatusObserver = {
  onSuccess: (orchestrator: EditorOrchestratorInterface) => void
  onError: (error: string) => void
}

export class DocLoader implements DocLoaderInterface {
  private docController?: DocControllerInterface
  private commentsController?: CommentControllerInterface
  private orchestrator?: EditorOrchestratorInterface
  private readonly statusObservers: StatusObserver[] = []

  constructor(
    private websocketSerivce: WebsocketServiceInterface,
    private driveCompat: DriveCompat,
    private metricService: MetricService,
    private docsApi: DocsApi,
    private squashDoc: SquashDocument,
    private createInitialCommit: SeedInitialCommit,
    private loadDocument: LoadDocument,
    private loadCommit: LoadCommit,
    private encryptComment: EncryptComment,
    private createComment: CreateComment,
    private createThread: CreateThread,
    private loadThreads: LoadThreads,
    private handleRealtimeCommentsEvent: HandleRealtimeCommentsEvent,
    private duplicateDocument: DuplicateDocument,
    private createNewDocument: CreateNewDocument,
    private getDocumentMeta: GetDocumentMeta,
    private getNode: GetNode,
    private exportAndDownload: ExportAndDownload,
    private unleashClient: UnleashClient,
    private eventBus: InternalEventBusInterface,
    private logger: LoggerInterface,
  ) {}

  destroy(): void {
    this.docController?.destroy()
  }

  public async initialize(nodeMeta: NodeMeta): Promise<void> {
    if (this.docController) {
      throw new Error('[DocLoader] docController already initialized')
    }

    const controller = new DocController(
      nodeMeta,
      this.driveCompat,
      this.squashDoc,
      this.createInitialCommit,
      this.loadDocument,
      this.loadCommit,
      this.duplicateDocument,
      this.createNewDocument,
      this.getDocumentMeta,
      this.exportAndDownload,
      this.getNode,
      this.websocketSerivce,
      this.eventBus,
      this.logger,
    )

    this.docController = controller

    const result = await this.docController.initialize()

    if (result.isFailed()) {
      this.statusObservers.forEach((observer) => {
        observer.onError(result.getError())
      })
      return
    }

    const { entitlements } = result.getValue()

    const getLatestDocumentName = () => controller.getSureDocument().name

    this.commentsController = new CommentController(
      nodeMeta,
      entitlements.keys,
      this.websocketSerivce,
      this.metricService,
      this.docsApi,
      this.encryptComment,
      this.createThread,
      this.createComment,
      this.loadThreads,
      this.handleRealtimeCommentsEvent,
      getLatestDocumentName,
      this.unleashClient,
      this.eventBus,
      this.logger,
    )

    this.commentsController.fetchAllComments()

    this.orchestrator = new EditorOrchestrator(this.commentsController, this.docController, this.docsApi, this.eventBus)

    this.statusObservers.forEach((observer) => {
      if (this.orchestrator) {
        observer.onSuccess(this.orchestrator)
      }
    })
  }

  public getDocController(): DocControllerInterface {
    if (!this.docController) {
      throw new Error('DocController not ready')
    }

    return this.docController
  }

  public addStatusObserver(observer: StatusObserver): () => void {
    this.statusObservers.push(observer)

    if (this.orchestrator) {
      observer.onSuccess(this.orchestrator)
    }

    return () => {
      this.statusObservers.splice(this.statusObservers.indexOf(observer), 1)
    }
  }
}
