import {
  CommentsMessageType,
  AnyCommentMessageData,
  AddThreadData,
  AddCommentData,
  EditCommentData,
  DeleteThreadData,
  DeleteCommentData,
  BeganTypingData,
  StoppedTypingData,
} from '@proton/docs-shared'
import { uint8ArrayToString } from '@proton/shared/lib/helpers/encoding'
import { Comment, CommentThread } from '../Models'
import { LocalCommentsState } from '../Services/Comments/LocalCommentsState'
import { Result, SyncUseCaseInterface } from '@standardnotes/domain-core'
import { LiveComments } from '../Realtime/LiveComments/LiveComments'
import { getErrorString } from '../Util/GetErrorString'

/**
 * Updates the local comment state after receiving a message from the RTS.
 */
export class HandleRealtimeCommentsEvent implements SyncUseCaseInterface<void> {
  execute(localCommentsState: LocalCommentsState, liveComments: LiveComments, payloadData: Uint8Array): Result<void> {
    try {
      const jsonString = uint8ArrayToString(payloadData)
      const { type, data } = JSON.parse(jsonString) as { type: CommentsMessageType; data: AnyCommentMessageData }
      switch (type) {
        case CommentsMessageType.AddThread: {
          const threadData = data as AddThreadData
          const thread = CommentThread.fromPayload(threadData)
          localCommentsState.addThread(thread)
          break
        }
        case CommentsMessageType.AddComment: {
          const commentData = data as AddCommentData
          const comment = Comment.fromPayload(commentData.comment)
          localCommentsState.addComment(comment, commentData.threadID)
          break
        }
        case CommentsMessageType.EditComment:
          localCommentsState.editComment(data as EditCommentData)
          break
        case CommentsMessageType.DeleteThread:
          localCommentsState.deleteThread((data as DeleteThreadData).threadId)
          break
        case CommentsMessageType.DeleteComment:
          localCommentsState.deleteComment(data as DeleteCommentData)
          break
        case CommentsMessageType.BeganTyping:
        case CommentsMessageType.StoppedTyping:
          liveComments.receiveTypingStatusMessage(type, data as BeganTypingData | StoppedTypingData)
          break
        case CommentsMessageType.ResolveThread:
          localCommentsState.resolveThread((data as DeleteThreadData).threadId)
          break
        case CommentsMessageType.UnresolveThread:
          localCommentsState.unresolveThread((data as DeleteThreadData).threadId)
          break

        default:
          break
      }
    } catch (error) {
      return Result.fail(getErrorString(error) ?? 'Failed to handle a realtime comments event.')
    }

    return Result.ok()
  }
}
