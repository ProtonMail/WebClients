import type {
  AnyCommentMessageData,
  CommentServiceInterface,
  CommentThreadInterface,
  CommentInterface,
  InternalEventHandlerInterface,
  InternalEventInterface,
  InternalEventBusInterface,
  CommentMarkNodeChangeData,
  SuggestionThreadStateAction,
} from '@proton/docs-shared'
import { CommentsMessageType, CommentsEvent, BroadcastSource, CommentThreadState } from '@proton/docs-shared'
import type { EncryptComment } from '../../UseCase/EncryptComment'
import type { LoggerInterface } from '@proton/utils/logs'
import { CreateRealtimeCommentPayload } from './CreateRealtimeCommentPayload'
import type { DocumentKeys, NodeMeta } from '@proton/drive-store'
import { LocalCommentsState } from './LocalCommentsState'
import type { HandleRealtimeCommentsEvent } from '../../UseCase/HandleRealtimeCommentsEvent'
import type { CreateThread } from '../../UseCase/CreateThread'
import type { CreateComment } from '../../UseCase/CreateComment'
import type { LoadThreads } from '../../UseCase/LoadThreads'
import { LiveComments } from '../../Realtime/LiveComments/LiveComments'
import type { WebsocketServiceInterface } from '../Websockets/WebsocketServiceInterface'
import type { DocControllerEventPayloads } from '../../Controller/Document/DocControllerEvent'
import { DocControllerEvent } from '../../Controller/Document/DocControllerEvent'
import metrics from '@proton/metrics'
import { EventTypeEnum } from '@proton/docs-proto'
import type { DocsApi } from '../../Api/DocsApi'
import { CommentThreadType } from '@proton/docs-shared'

export class CommentService implements CommentServiceInterface, InternalEventHandlerInterface {
  private localCommentsState: LocalCommentsState

  public readonly liveComments: LiveComments = new LiveComments(
    this.websocketService,
    this.document,
    this.keys.userOwnAddress,
    this.eventBus,
    this.logger,
  )

  constructor(
    private readonly document: NodeMeta,
    private readonly keys: DocumentKeys,
    private readonly websocketService: WebsocketServiceInterface,
    private api: DocsApi,
    private _encryptComment: EncryptComment,
    private _createThread: CreateThread,
    private _createComment: CreateComment,
    private _loadThreads: LoadThreads,
    private _handleRealtimeEvent: HandleRealtimeCommentsEvent,
    public readonly eventBus: InternalEventBusInterface,
    private logger: LoggerInterface,
  ) {
    this.localCommentsState = new LocalCommentsState(eventBus)
    eventBus.addEventHandler(this, DocControllerEvent.RealtimeCommentMessageReceived)
  }

  get userDisplayName(): string {
    return this.keys.userOwnAddress
  }

  public initialize(): void {
    void this._loadThreads.execute({
      lookup: this.document,
      keys: this.keys,
      commentsState: this.localCommentsState,
    })
  }

  private broadcastCommentMessage(type: CommentsMessageType, dto: AnyCommentMessageData): void {
    const data = CreateRealtimeCommentPayload(type, dto)

    void this.websocketService.sendEventMessage(
      this.document,
      data,
      EventTypeEnum.ClientHasSentACommentMessage,
      BroadcastSource.CommentsController,
    )

    if ([CommentsMessageType.AddThread, CommentsMessageType.AddComment].includes(type)) {
      metrics.docs_comments_total.increment({
        type: CommentsMessageType.AddThread === type ? 'comment' : 'reply',
      })
    }
  }

  public getTypersExcludingSelf(threadId: string): string[] {
    return this.liveComments.getTypingUsers(threadId).filter((user) => user !== this.keys.userOwnAddress)
  }

  public beganTypingInThread(threadID: string): void {
    this.liveComments.setIsTypingComment(threadID, true)
  }

  public stoppedTypingInThread(threadID: string): void {
    this.liveComments.setIsTypingComment(threadID, false)
  }

  async handleEvent(event: InternalEventInterface): Promise<void> {
    if (event.type !== DocControllerEvent.RealtimeCommentMessageReceived) {
      return
    }

    const { message } = event.payload as DocControllerEventPayloads[DocControllerEvent.RealtimeCommentMessageReceived]

    this._handleRealtimeEvent.execute(this.localCommentsState, this.liveComments, message)
  }

  getAllThreads(): CommentThreadInterface[] {
    return this.localCommentsState.getAllThreads()
  }

  async createCommentThread(
    commentContent: string,
    markID?: string,
    createMarkNode = true,
  ): Promise<CommentThreadInterface | undefined> {
    const threadResult = await this._createThread.execute({
      text: commentContent,
      keys: this.keys,
      lookup: this.document,
      commentsState: this.localCommentsState,
      markID,
      createMarkNode,
      type: CommentThreadType.Comment,
    })

    if (threadResult.isFailed()) {
      this.logger.error(threadResult.getError())
      return undefined
    }

    const thread = threadResult.getValue()

    this.broadcastCommentMessage(CommentsMessageType.AddThread, thread.asPayload())

    return thread
  }

  async createSuggestionThread(suggestionID: string): Promise<CommentThreadInterface | undefined> {
    const threadResult = await this._createThread.execute({
      text: '',
      keys: this.keys,
      lookup: this.document,
      commentsState: this.localCommentsState,
      markID: suggestionID,
      createMarkNode: false,
      type: CommentThreadType.Suggestion,
    })

    if (threadResult.isFailed()) {
      this.logger.error(threadResult.getError())
      return undefined
    }

    const thread = threadResult.getValue()

    this.broadcastCommentMessage(CommentsMessageType.AddThread, thread.asPayload())

    return thread
  }

  async createComment(content: string, threadID: string): Promise<CommentInterface | undefined> {
    const commentResult = await this._createComment.execute({
      text: content,
      threadID,
      keys: this.keys,
      lookup: this.document,
      commentsState: this.localCommentsState,
    })

    if (commentResult.isFailed()) {
      this.logger.error(commentResult.getError())
      return undefined
    }

    const comment = commentResult.getValue()

    this.broadcastCommentMessage(CommentsMessageType.AddComment, { comment: comment.asPayload(), threadID })

    return comment
  }

  async editComment(threadID: string, commentID: string, content: string): Promise<boolean> {
    const thread = this.localCommentsState.findThreadById(threadID)
    if (!thread) {
      throw new Error('Thread not found')
    }

    const encryptionResult = await this._encryptComment.execute(content, thread.markID, this.keys)
    if (encryptionResult.isFailed()) {
      return false
    }

    const encryptedContent = encryptionResult.getValue()

    const result = await this.api.editComment({
      volumeId: this.document.volumeId,
      linkId: this.document.linkId,
      threadId: threadID,
      commentId: commentID,
      encryptedContent: encryptedContent,
      authorEmail: this.keys.userOwnAddress,
    })
    if (result.isFailed()) {
      return false
    }

    this.localCommentsState.editComment({ commentID, threadID, content })

    this.broadcastCommentMessage(CommentsMessageType.EditComment, { commentID, threadID, content })

    return true
  }

  async deleteThread(id: string): Promise<boolean> {
    const response = await this.api.deleteThread(this.document.volumeId, this.document.linkId, id)
    if (response.isFailed()) {
      return false
    }

    this.localCommentsState.deleteThread(id)

    this.broadcastCommentMessage(CommentsMessageType.DeleteThread, { threadId: id })

    return true
  }

  async deleteComment(threadID: string, commentID: string): Promise<boolean> {
    const response = await this.api.deleteComment(this.document.volumeId, this.document.linkId, threadID, commentID)
    if (response.isFailed()) {
      return false
    }

    this.localCommentsState.deleteComment({ commentID, threadID })

    this.broadcastCommentMessage(CommentsMessageType.DeleteComment, { commentID, threadID })

    return true
  }

  async resolveThread(threadId: string): Promise<boolean> {
    const response = await this.api.resolveThread(this.document.volumeId, this.document.linkId, threadId)
    if (response.isFailed()) {
      return false
    }

    const resolvedThread = this.localCommentsState.resolveThread(threadId)
    if (!resolvedThread) {
      return false
    }

    this.eventBus.publish<CommentMarkNodeChangeData>({
      type: CommentsEvent.ResolveMarkNode,
      payload: {
        markID: resolvedThread.markID,
      },
    })

    this.broadcastCommentMessage(CommentsMessageType.ResolveThread, { threadId })

    return true
  }

  async unresolveThread(threadId: string): Promise<boolean> {
    const response = await this.api.unresolveThread(this.document.volumeId, this.document.linkId, threadId)
    if (response.isFailed()) {
      return false
    }

    const unresolvedThread = this.localCommentsState.unresolveThread(threadId)
    if (!unresolvedThread) {
      return false
    }

    this.eventBus.publish<CommentMarkNodeChangeData>({
      type: CommentsEvent.UnresolveMarkNode,
      payload: {
        markID: unresolvedThread.markID,
      },
    })

    this.broadcastCommentMessage(CommentsMessageType.UnresolveThread, { threadId })

    return true
  }

  async changeSuggestionThreadState(threadId: string, action: SuggestionThreadStateAction): Promise<boolean> {
    const response = await this.api.changeSuggestionThreadState(
      this.document.volumeId,
      this.document.linkId,
      threadId,
      action,
    )
    if (response.isFailed()) {
      return false
    }

    let state = CommentThreadState.Active
    if (action === 'accept') {
      state = CommentThreadState.Accepted
    } else if (action === 'reject') {
      state = CommentThreadState.Rejected
    }

    const thread = this.localCommentsState.changeThreadState(threadId, state)
    if (!thread) {
      return false
    }

    return true
  }

  markThreadAsRead(id: string): void {
    this.localCommentsState.markThreadAsRead(id)
  }
}
