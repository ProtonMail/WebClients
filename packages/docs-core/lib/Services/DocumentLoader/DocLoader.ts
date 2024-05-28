import { EncryptMessage } from '../../UseCase/EncryptMessage'
import { LoggerInterface } from '@standardnotes/utils'
import { UserService } from '../User/UserService'
import { DocController } from '../../Controller/Document/DocController'
import { SquashDocument } from '../../UseCase/SquashDocument'
import { InternalEventBusInterface, CommentServiceInterface } from '@proton/docs-shared'
import { CommentsApi } from '../../Api/Comments/CommentsApi'
import { DecryptMessage } from '../../UseCase/DecryptMessage'
import { EncryptComment } from '../../UseCase/EncryptComment'
import { DuplicateDocument } from '../../UseCase/DuplicateDocument'
import { CreateNewDocument } from '../../UseCase/CreateNewDocument'
import { GetRealtimeUrlAndToken } from '../../Api/Docs/CreateRealtimeValetToken'
import { EditorOrchestrator } from '../Orchestrator/EditorOrchestrator'
import { LoadDocument } from '../../UseCase/LoadDocument'
import { DebugSendCommitCommandToRTS } from '../../UseCase/SendCommitCommandToRTS'
import { DebugCreateInitialCommit } from '../../UseCase/CreateInitialCommit'
import { GetDocumentMeta } from '../../UseCase/GetDocumentMeta'
import { DriveCompat, NodeMeta } from '@proton/drive-store'
import { HandleRealtimeCommentsEvent } from '../../UseCase/HandleRealtimeCommentsEvent'
import { CreateComment } from '../../UseCase/CreateComment'
import { CreateThread } from '../../UseCase/CreateThread'
import { LoadThreads } from '../../UseCase/LoadThreads'
import { DocLoaderInterface } from './DocLoaderInterface'
import { EditorOrchestratorInterface } from '../Orchestrator/EditorOrchestratorInterface'
import { DocControllerInterface } from '../../Controller/Document/DocControllerInterface'
import { CommentService } from '../Comments/CommentService'

export type StatusObserver = {
  onSuccess: (orchestrator: EditorOrchestratorInterface) => void
  onError: (error: string) => void
}

export class DocLoader implements DocLoaderInterface {
  private docController?: DocControllerInterface
  private commentsController?: CommentServiceInterface
  private orchestrator?: EditorOrchestratorInterface
  private readonly statusObservers: StatusObserver[] = []

  constructor(
    private userService: UserService,
    private driveCompat: DriveCompat,
    private commentsApi: CommentsApi,
    private squashDoc: SquashDocument,
    private createInitialCommit: DebugCreateInitialCommit,
    private sendCommitCommandToRTS: DebugSendCommitCommandToRTS,
    private loadDocument: LoadDocument,
    private encryptMessage: EncryptMessage,
    private decryptMessage: DecryptMessage,
    private encryptComment: EncryptComment,
    private createComment: CreateComment,
    private createThread: CreateThread,
    private loadThreads: LoadThreads,
    private handleRealtimeCommentsEvent: HandleRealtimeCommentsEvent,
    private duplicateDocument: DuplicateDocument,
    private createNewDocument: CreateNewDocument,
    private createRealtimeValetToken: GetRealtimeUrlAndToken,
    private getDocumentMeta: GetDocumentMeta,
    private eventBus: InternalEventBusInterface,
    private logger: LoggerInterface,
  ) {}

  public async initialize(lookup: NodeMeta): Promise<void> {
    if (this.docController) {
      throw new Error('[DocLoader] docController already initialized')
    }

    this.docController = new DocController(
      lookup,
      this.userService,
      this.driveCompat,
      this.squashDoc,
      this.createInitialCommit,
      this.sendCommitCommandToRTS,
      this.loadDocument,
      this.encryptMessage,
      this.decryptMessage,
      this.duplicateDocument,
      this.createNewDocument,
      this.createRealtimeValetToken,
      this.getDocumentMeta,
      this.eventBus,
      this.logger,
    )

    const result = await this.docController.initialize()

    if (result.isFailed()) {
      this.statusObservers.forEach((observer) => {
        observer.onError(result.getError())
      })
      return
    }

    const { keys, connection } = result.getValue()

    const username = this.userService.user.Email || this.userService.getUserId()

    this.commentsController = new CommentService(
      lookup,
      keys,
      username,
      this.commentsApi,
      connection,
      this.encryptComment,
      this.createThread,
      this.createComment,
      this.loadThreads,
      this.handleRealtimeCommentsEvent,
      this.eventBus,
      this.logger,
    )

    this.commentsController.initialize()

    this.orchestrator = new EditorOrchestrator(this.commentsController, this.docController)

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
