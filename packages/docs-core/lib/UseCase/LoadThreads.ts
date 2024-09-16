import metrics from '@proton/metrics'
import type { UseCaseInterface } from '../Domain/UseCase/UseCaseInterface'
import { Result } from '../Domain/Result/Result'
import type { DocumentKeys, NodeMeta } from '@proton/drive-store'
import { CommentThread } from '../Models'
import { ServerTime } from '@proton/docs-shared'
import type { DecryptComment } from './DecryptComment'
import type { LocalCommentsState } from '../Services/Comments/LocalCommentsState'
import type { DocsApi } from '../Api/DocsApi'
import type { LoggerInterface } from '@proton/utils/logs'

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
    lookup: NodeMeta
    keys: DocumentKeys
    commentsState: LocalCommentsState
  }): Promise<Result<void>> {
    const result = await this.api.getAllThreadIDs(dto.lookup.volumeId, dto.lookup.linkId)
    if (result.isFailed()) {
      metrics.docs_comments_download_error_total.increment({
        reason: 'server_error',
      })

      return Result.fail(result.getError())
    }

    const response = result.getValue()

    await Promise.all(
      response.CommentThreads.map(async (threadID) => {
        return this.loadThread({ threadID, lookup: dto.lookup, keys: dto.keys, commentsState: dto.commentsState })
      }),
    )

    dto.commentsState.sortThreadsAndNotify()

    return Result.ok()
  }

  private async loadThread(dto: {
    threadID: string
    lookup: NodeMeta
    keys: DocumentKeys
    commentsState: LocalCommentsState
  }): Promise<Result<void>> {
    const thread = await this.api.getThread(dto.lookup.volumeId, dto.lookup.linkId, dto.threadID)
    if (thread.isFailed()) {
      metrics.docs_comments_download_error_total.increment({
        reason: 'server_error',
      })

      return Result.fail(thread.getError())
    }

    const { CommentThread: commentThreadDto } = thread.getValue()
    const comments = await Promise.all(
      commentThreadDto.Comments.map(async (commentDto) => {
        const result = await this.decryptComment.execute(commentDto, commentThreadDto.Mark, dto.keys)
        return result
      }),
    )

    const failedComments = comments.filter((result) => result.isFailed())
    for (const failed of failedComments) {
      this.logger.error(failed.getError())
    }

    const successfulComments = comments.filter((result) => !result.isFailed())

    const localThread = new CommentThread(
      commentThreadDto.CommentThreadID,
      new ServerTime(commentThreadDto.CreateTime),
      new ServerTime(commentThreadDto.ModifyTime),
      commentThreadDto.Mark,
      successfulComments.map((result) => result.getValue()),
      false,
      commentThreadDto.State,
      commentThreadDto.Type,
    )

    dto.commentsState.addThread(localThread)

    return Result.ok()
  }
}
