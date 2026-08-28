import { CommentThread } from '../Models'
import { CommentThreadType, CommentType, ServerTime, Result } from '@proton/docs-shared'
import metrics from '@proton/metrics'
import type { DecryptComment } from './DecryptComment'
import type { DocsApi } from '../Api/DocsApi'
import type { DocumentEntitlements, PublicDocumentEntitlements } from '../Types/DocumentEntitlements'
import type { LocalCommentsState } from '../Services/Comments/LocalCommentsState'
import type { LoggerInterface } from '@proton/shared/lib/logs'
import type { UseCaseInterface } from '../Domain/UseCase/UseCaseInterface'

const THREAD_LOAD_BATCH_SIZE = 5

/**
 * Updates the local comment state by loading and decrypting all threads from the API for the document.
 */
export class LoadThreads implements UseCaseInterface<void> {
  constructor(
    private api: DocsApi,
    private decryptComment: DecryptComment,
    private logger: LoggerInterface,
  ) {}

  async execute(dto: {
    entitlements: PublicDocumentEntitlements | DocumentEntitlements
    commentsState: LocalCommentsState
  }): Promise<Result<void>> {
    const result = await this.api.getAllThreadIDs(dto.entitlements.nodeMeta)
    if (result.isFailed()) {
      metrics.docs_comments_download_error_total.increment({
        reason: 'server_error',
      })

      return Result.fail(result.getErrorMessage())
    }

    const response = result.getValue()

    await this.loadThreadsInBatches(response.CommentThreads, dto)

    dto.commentsState.sortThreadsAndNotify()

    return Result.ok()
  }

  private async loadThreadsInBatches(
    threadIDs: string[],
    dto: {
      entitlements: PublicDocumentEntitlements | DocumentEntitlements
      commentsState: LocalCommentsState
    },
  ): Promise<void> {
    for (let i = 0; i < threadIDs.length; i += THREAD_LOAD_BATCH_SIZE) {
      const batch = threadIDs.slice(i, i + THREAD_LOAD_BATCH_SIZE)
      await Promise.all(
        batch.map((threadID) =>
          this.loadThread({ threadID, entitlements: dto.entitlements, commentsState: dto.commentsState }),
        ),
      )
    }
  }

  private async loadThread(dto: {
    threadID: string
    entitlements: PublicDocumentEntitlements | DocumentEntitlements
    commentsState: LocalCommentsState
  }): Promise<Result<void>> {
    const thread = await this.api.getThread({
      nodeMeta: dto.entitlements.nodeMeta,
      threadId: dto.threadID,
    })
    if (thread.isFailed()) {
      metrics.docs_comments_download_error_total.increment({
        reason: 'server_error',
      })

      return Result.fail(thread.getErrorMessage())
    }

    const { CommentThread: commentThreadDto } = thread.getValue()

    const comments = await Promise.all(
      commentThreadDto.Comments.map(async (commentDto) => {
        const result = await this.decryptComment.execute(commentDto, commentThreadDto.Mark, dto.entitlements.keys)
        if (!result.isFailed()) {
          return result.getValue()
        }

        if (commentDto.Type === CommentType.Suggestion || commentThreadDto.Type === CommentThreadType.Suggestion) {
          this.logger.error(`[LoadThreads] Failed to decrypt suggestion comment: ${result.getError()}`)
        } else {
          this.logger.error(`[LoadThreads] Failed to decrypt comment: ${result.getError()}`)
        }

        return undefined
      }),
    )

    const successfulComments = comments.filter((result) => !!result)

    const localThread = new CommentThread(
      commentThreadDto.CommentThreadID,
      new ServerTime(commentThreadDto.CreateTime),
      new ServerTime(commentThreadDto.ModifyTime),
      commentThreadDto.Mark,
      successfulComments,
      false,
      commentThreadDto.State,
      commentThreadDto.Type,
      commentThreadDto.CommentThreadID,
    )

    dto.commentsState.addThread(localThread, false, false)

    return Result.ok()
  }
}
