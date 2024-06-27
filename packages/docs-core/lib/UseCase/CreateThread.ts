import { UseCaseInterface } from '../Domain/UseCase/UseCaseInterface'
import { Result } from '../Domain/Result/Result'
import { DocumentKeys, NodeMeta } from '@proton/drive-store'
import { Comment, CommentThread } from '../Models'
import {
  CommentMarkNodeChangeData,
  CommentThreadInterface,
  CommentThreadState,
  CommentsEvent,
  InternalEventBusInterface,
  ServerTime,
} from '@proton/docs-shared'
import { GenerateUUID } from '../Util/GenerateUuid'
import { EncryptComment } from './EncryptComment'
import { DecryptComment } from './DecryptComment'
import { LocalCommentsState } from '../Services/Comments/LocalCommentsState'
import { DocsApi } from '../Api/Docs/DocsApi'

/**
 * Creates a new comment thread with the API, supplying and encrypting an initial comment.
 */
export class CreateThread implements UseCaseInterface<CommentThreadInterface> {
  constructor(
    private api: DocsApi,
    private encryptComment: EncryptComment,
    private decryptComment: DecryptComment,
    private eventBus: InternalEventBusInterface,
  ) {}

  async execute(dto: {
    text: string
    lookup: NodeMeta
    userDisplayName: string
    keys: DocumentKeys
    commentsState: LocalCommentsState
  }): Promise<Result<CommentThreadInterface>> {
    const markID = GenerateUUID()

    const comment = new Comment(
      GenerateUUID(),
      ServerTime.now(),
      ServerTime.now(),
      dto.text,
      null,
      dto.userDisplayName,
      [],
      false,
    )

    const localThread = new CommentThread(
      GenerateUUID(),
      ServerTime.now(),
      ServerTime.now(),
      markID,
      [comment],
      true,
      CommentThreadState.Active,
    )

    dto.commentsState.addThread(localThread)

    this.eventBus.publish<CommentMarkNodeChangeData>({
      type: CommentsEvent.CreateMarkNode,
      payload: {
        markID,
      },
    })

    const onFail = () => {
      dto.commentsState.deleteThread(localThread.id)
      this.eventBus.publish<CommentMarkNodeChangeData>({
        type: CommentsEvent.RemoveMarkNode,
        payload: {
          markID,
        },
      })
    }

    const commentEncryptionResult = await this.encryptComment.execute(dto.text, markID, dto.keys)
    if (commentEncryptionResult.isFailed()) {
      onFail()
      return Result.fail(commentEncryptionResult.getError())
    }

    const encryptedCommentContent = commentEncryptionResult.getValue()

    const result = await this.api.createThread(dto.lookup.volumeId, dto.lookup.linkId, markID, encryptedCommentContent)

    if (result.isFailed()) {
      onFail()
      return Result.fail(result.getError())
    }

    const response = result.getValue()

    const comments = await Promise.all(
      response.CommentThread.Comments.map(async (commentDto) => {
        const result = await this.decryptComment.execute(commentDto, response.CommentThread.Mark, dto.keys)
        return result
      }),
    )

    const thread = new CommentThread(
      response.CommentThread.CommentThreadID,
      new ServerTime(response.CommentThread.CreateTime),
      new ServerTime(response.CommentThread.ModifyTime),
      response.CommentThread.Mark,
      comments.map((result) => result.getValue()),
      false,
      response.CommentThread.State,
    )

    dto.commentsState.replacePlaceholderThread(localThread.id, thread)

    return Result.ok(thread)
  }
}
