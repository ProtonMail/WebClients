import type { UseCaseInterface } from '../Domain/UseCase/UseCaseInterface'
import { Result } from '@proton/docs-shared'
import { Comment, CommentThread } from '../Models'
import type { CommentMarkNodeChangeData, CommentThreadInterface, InternalEventBusInterface } from '@proton/docs-shared'
import { CommentThreadState, CommentType, CommentsEvent, ServerTime } from '@proton/docs-shared'
import { GenerateUUID } from '../Util/GenerateUuid'
import type { EncryptComment } from './EncryptComment'
import type { DecryptComment } from './DecryptComment'
import type { LocalCommentsState } from '../Services/Comments/LocalCommentsState'
import type { DocsApi } from '../Api/DocsApi'
import metrics from '@proton/metrics'
import { CommentThreadType } from '@proton/docs-shared'
import type { LoggerInterface } from '@proton/utils/logs'
import type { DocumentEntitlements, PublicDocumentEntitlements } from '../Types/DocumentEntitlements'
import { isPrivateDocumentKeys } from '../Types/DocumentEntitlements'

/**
 * Creates a new comment thread with the API, supplying and encrypting an initial comment.
 */
export class CreateThread implements UseCaseInterface<CommentThreadInterface> {
  constructor(
    private api: DocsApi,
    private encryptComment: EncryptComment,
    private decryptComment: DecryptComment,
    private eventBus: InternalEventBusInterface,
    private logger: LoggerInterface,
  ) {}

  async execute(dto: {
    text: string
    entitlements: PublicDocumentEntitlements | DocumentEntitlements
    commentsState: LocalCommentsState
    type: CommentThreadType
    decryptedDocumentName: string | null
    markID?: string
    createMarkNode?: boolean
  }): Promise<Result<CommentThreadInterface>> {
    const markID = dto.markID ?? GenerateUUID()

    const commentType = dto.type === CommentThreadType.Suggestion ? CommentType.Suggestion : CommentType.Comment

    const comment = new Comment(
      GenerateUUID(),
      ServerTime.now(),
      ServerTime.now(),
      dto.text,
      null,
      isPrivateDocumentKeys(dto.entitlements.keys) ? dto.entitlements.keys.userOwnAddress : undefined,
      [],
      false,
      commentType,
    )

    const localID = GenerateUUID()

    const localThread = new CommentThread(
      localID,
      ServerTime.now(),
      ServerTime.now(),
      markID,
      [comment],
      true,
      CommentThreadState.Active,
      dto.type,
      localID,
    )

    dto.commentsState.addThread(localThread)

    const shouldCreateMark = dto.createMarkNode ?? true

    if (shouldCreateMark) {
      this.eventBus.publish<CommentMarkNodeChangeData>({
        type: CommentsEvent.CreateMarkNode,
        payload: {
          markID,
        },
      })
    }

    const onFail = () => {
      dto.commentsState.deleteThread(localThread.id)

      if (shouldCreateMark) {
        this.eventBus.publish<CommentMarkNodeChangeData>({
          type: CommentsEvent.RemoveMarkNode,
          payload: {
            markID,
          },
        })
      }
    }

    const commentEncryptionResult = await this.encryptComment.execute(dto.text, markID, dto.entitlements.keys)
    if (commentEncryptionResult.isFailed()) {
      onFail()
      return Result.fail(commentEncryptionResult.getError())
    }

    const encryptedCommentContent = commentEncryptionResult.getValue()

    const result = await this.api.createThread(
      {
        markId: markID,
        encryptedMainCommentContent: encryptedCommentContent,
        type: dto.type,
        commentType,
        decryptedDocumentName: dto.decryptedDocumentName,
      },
      dto.entitlements,
    )

    if (result.isFailed()) {
      metrics.docs_comments_error_total.increment({
        reason: 'server_error',
      })

      onFail()

      return Result.fail(result.getError().message)
    }

    const response = result.getValue()

    const comments = await Promise.all(
      response.CommentThread.Comments.map(async (commentDto) => {
        const result = await this.decryptComment.execute(commentDto, response.CommentThread.Mark, dto.entitlements.keys)
        return result
      }),
    )

    const failedComments = comments.filter((result) => result.isFailed())
    for (const failed of failedComments) {
      this.logger.error(`[CreateThread] Failed to decrypt comment: ${failed.getError()}`)
    }

    const successfulComments = comments.filter((result) => !result.isFailed())

    const thread = new CommentThread(
      response.CommentThread.CommentThreadID,
      new ServerTime(response.CommentThread.CreateTime),
      new ServerTime(response.CommentThread.ModifyTime),
      response.CommentThread.Mark,
      successfulComments.map((result) => result.getValue()),
      false,
      response.CommentThread.State,
      response.CommentThread.Type,
      localID,
    )

    dto.commentsState.replacePlaceholderThread(localThread.id, thread)

    return Result.ok(thread)
  }
}
