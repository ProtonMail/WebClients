import { NodeMeta } from '@proton/drive-store'
import { BeganTypingData, BroadcastSource, CommentsMessageType, StoppedTypingData } from '@proton/docs-shared'
import { LiveCommentsEvent, LiveCommentsTypeStatusChangeData, InternalEventBusInterface } from '@proton/docs-shared'
import { CreateRealtimeCommentPayload } from '../../Services/Comments/CreateRealtimeCommentPayload'
import { CommentTypers } from './CommentTypers'
import { WebsocketServiceInterface } from '../../Services/Websockets/WebsocketServiceInterface'
import { EventTypeEnum } from '@proton/docs-proto'
import { LoggerInterface } from '@proton/utils/logs'

export class LiveComments {
  private state: Record<string, CommentTypers> = {}

  constructor(
    private websocketService: WebsocketServiceInterface,
    private readonly document: NodeMeta,
    private readonly userDisplayName: string,
    private readonly eventBus: InternalEventBusInterface,
    private readonly logger: LoggerInterface,
  ) {}

  public setIsTypingComment(commentId: string, isTyping: boolean): void {
    const { didChange } = this.updateStatusOfTyper(commentId, this.userDisplayName, isTyping)
    if (!didChange) {
      return
    }

    this.logger.info(`User ${this.userDisplayName} is ${isTyping ? 'typing' : 'stopped typing'} in thread ${commentId}`)

    const message = isTyping
      ? CreateRealtimeCommentPayload(CommentsMessageType.BeganTyping, {
          threadID: commentId,
          userId: this.userDisplayName,
        })
      : CreateRealtimeCommentPayload(CommentsMessageType.StoppedTyping, {
          threadID: commentId,
          userId: this.userDisplayName,
        })

    void this.websocketService.sendEventMessage(
      this.document,
      message,
      EventTypeEnum.ClientHasSentACommentMessage,
      BroadcastSource.TypingStatusChange,
    )
  }

  private updateStatusOfTyper(threadId: string, userId: string, isTyping: boolean): { didChange: boolean } {
    const typers = this.state[threadId] ?? new CommentTypers(threadId)

    if (isTyping === typers.isUserTyping(userId)) {
      return { didChange: false }
    }

    if (isTyping) {
      typers.addUser(userId)
    } else {
      typers.removeUser(userId)
    }

    this.state[threadId] = typers

    this.eventBus.publish({
      type: LiveCommentsEvent.TypingStatusChange,
      payload: { threadId } as LiveCommentsTypeStatusChangeData,
    })

    return { didChange: true }
  }

  public receiveTypingStatusMessage(type: CommentsMessageType, data: BeganTypingData | StoppedTypingData): void {
    switch (type) {
      case CommentsMessageType.BeganTyping:
        this.updateStatusOfTyper(data.threadID, data.userId, true)
        break
      case CommentsMessageType.StoppedTyping:
        this.updateStatusOfTyper(data.threadID, data.userId, false)
        break
    }
  }

  public getTypingUsers(commentId: string): string[] {
    return this.state[commentId]?.getUsers() ?? []
  }
}
