import { Comment } from '../Models'
import { GenerateUUID } from '@proton/docs-shared'
import type { DocumentEntitlements, PublicDocumentEntitlements } from '../Types/DocumentEntitlements'
import { Result } from '@proton/docs-shared'
import { ServerTime } from '@proton/docs-shared'
import metrics from '@proton/metrics'
import type { CommentInterface, CommentType } from '@proton/docs-shared'
import type { DocsApi } from '../Api/DocsApi'
import type { EncryptComment } from './EncryptComment'
import type { LocalCommentsState } from '../Services/Comments/LocalCommentsState'
import type { UseCaseInterface } from '../Domain/UseCase/UseCaseInterface'

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
    entitlements: PublicDocumentEntitlements | DocumentEntitlements
    commentsState: LocalCommentsState
    type: CommentType
    decryptedDocumentName: string | null
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
      dto.entitlements.keys.userOwnAddress,
      [],
      true,
      { verified: true },
      dto.type,
    )

    dto.commentsState.addComment(localComment, dto.threadID)

    const encryptionResult = await this.encryptComment.execute(dto.text, thread.markID, dto.entitlements.keys)

    if (encryptionResult.isFailed()) {
      dto.commentsState.deleteComment({ commentID: localComment.id, threadID: dto.threadID })
      return Result.fail(encryptionResult.getError())
    }

    const encryptedValue = encryptionResult.getValue()

    const result = await this.api.addCommentToThread(
      {
        threadId: dto.threadID,
        encryptedContent: encryptedValue,
        parentCommentId: null,
        type: dto.type,
        decryptedDocumentName: dto.decryptedDocumentName,
      },
      dto.entitlements,
    )

    if (result.isFailed()) {
      metrics.docs_comments_error_total.increment({
        reason: 'server_error',
      })

      dto.commentsState.deleteComment({ commentID: localComment.id, threadID: dto.threadID })
      return Result.fail(result.getErrorMessage())
    }

    const { Comment: commentFromResponse } = result.getValue()

    const emailToUse = commentFromResponse.AuthorEmail || commentFromResponse.Author

    const comment = new Comment(
      commentFromResponse.CommentID,
      new ServerTime(commentFromResponse.CreateTime),
      new ServerTime(commentFromResponse.ModifyTime),
      dto.text,
      commentFromResponse.ParentCommentID,
      emailToUse,
      [],
      false,
      { verified: true },
      commentFromResponse.Type,
    )
    dto.commentsState.replacePlaceholderComment(localComment.id, comment)

    return Result.ok(comment)
  }
}
