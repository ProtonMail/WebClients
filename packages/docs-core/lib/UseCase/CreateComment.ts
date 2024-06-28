import { DocumentKeys, NodeMeta } from '@proton/drive-store'
import { Comment } from '../Models'
import { CommentInterface, ServerTime } from '@proton/docs-shared'
import { GenerateUUID } from '../Util/GenerateUuid'
import { EncryptComment } from './EncryptComment'
import { LocalCommentsState } from '../Services/Comments/LocalCommentsState'
import { Result } from '../Domain/Result/Result'
import { UseCaseInterface } from '../Domain/UseCase/UseCaseInterface'
import { DocsApi } from '../Api/Docs/DocsApi'
import metrics from '@proton/metrics'

/**
 * Creates and encrypts a new comment in a thread with the API.
 */
export class CreateComment implements UseCaseInterface<CommentInterface> {
  constructor(
    private api: DocsApi,
    private encryptComment: EncryptComment,
  ) {}

  async execute(dto: {
    text: string
    threadID: string
    lookup: NodeMeta
    keys: DocumentKeys
    commentsState: LocalCommentsState
  }): Promise<Result<CommentInterface>> {
    const thread = dto.commentsState.findThreadById(dto.threadID)
    if (!thread) {
      return Result.fail('Thread not found')
    }

    const localComment = new Comment(
      GenerateUUID(),
      ServerTime.now(),
      ServerTime.now(),
      dto.text,
      null,
      dto.keys.userOwnAddress,
      [],
      true,
    )

    dto.commentsState.addComment(localComment, dto.threadID)

    const encryptionResult = await this.encryptComment.execute(dto.text, thread.markID, dto.keys)

    if (encryptionResult.isFailed()) {
      dto.commentsState.deleteComment({ commentID: localComment.id, threadID: dto.threadID })
      return Result.fail(encryptionResult.getError())
    }

    const encryptedValue = encryptionResult.getValue()

    const result = await this.api.addCommentToThread({
      volumeId: dto.lookup.volumeId,
      linkId: dto.lookup.linkId,
      threadId: dto.threadID,
      encryptedContent: encryptedValue,
      parentCommentId: null,
      authorEmail: dto.keys.userOwnAddress,
    })
    if (result.isFailed()) {
      metrics.docs_comments_error_total.increment({
        reason: 'server_error',
      })

      dto.commentsState.deleteComment({ commentID: localComment.id, threadID: dto.threadID })
      return Result.fail(result.getError())
    }

    const { Comment: commentFromResponse } = result.getValue()

    const emailToUse = commentFromResponse.AuthorEmail || commentFromResponse.Author
    if (!emailToUse) {
      return Result.fail('No author email or author address found in comment')
    }

    const comment = new Comment(
      commentFromResponse.CommentID,
      new ServerTime(commentFromResponse.CreateTime),
      new ServerTime(commentFromResponse.ModifyTime),
      dto.text,
      commentFromResponse.ParentCommentID,
      emailToUse,
      [],
      false,
    )
    dto.commentsState.replacePlaceholderComment(localComment.id, comment)

    return Result.ok(comment)
  }
}
