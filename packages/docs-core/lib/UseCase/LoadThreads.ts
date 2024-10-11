import metrics from '@proton/metrics'
import type { UseCaseInterface } from '../Domain/UseCase/UseCaseInterface'
import { Result } from '../Domain/Result/Result'
import type { DocumentKeys, NodeMeta } from '@proton/drive-store'
import { CommentThread } from '../Models'
import { CommentThreadType, CommentType, ServerTime } from '@proton/docs-shared'
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
    const corruptThreadIds: Set<string> = new Set()

    const comments = await Promise.all(
      commentThreadDto.Comments.map(async (commentDto) => {
        const result = await this.decryptComment.execute(commentDto, commentThreadDto.Mark, dto.keys)
        if (!result.isFailed()) {
          return result.getValue()
        }

        /**
         * If the comment or suggestion refers to a date before the encryption incident was resolved,
         * and given that decryption has failed, we delete this comment thread from the API.
         * See DRVDOC-1194 for more information.
         */
        if (commentDto.Type === CommentType.Suggestion || commentThreadDto.Type === CommentThreadType.Suggestion) {
          this.logger.error(`[LoadThreads] Failed to decrypt suggestion comment: ${result.getError()}`)
          const dateEncryptionIncidentWasResolved = new Date('2024-10-03T12:00:00+02:00')
          const dateCommentWasCreated = new ServerTime(commentDto.CreateTime).date
          const commentWasCreatedBeforeEncryptionResolution = dateCommentWasCreated < dateEncryptionIncidentWasResolved
          if (commentWasCreatedBeforeEncryptionResolution) {
            corruptThreadIds.add(dto.threadID)
          }
        } else {
          this.logger.error(`[LoadThreads] Failed to decrypt comment: ${result.getError()}`)
        }

        return undefined
      }),
    )

    if (corruptThreadIds.size > 0) {
      void this.deleteCorruptSuggestionThreads(Array.from(corruptThreadIds), dto.lookup)

      if (corruptThreadIds.has(dto.threadID)) {
        return Result.ok()
      }
    }

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
    )

    dto.commentsState.addThread(localThread)

    return Result.ok()
  }

  private async deleteCorruptSuggestionThreads(threadIds: string[], lookup: NodeMeta): Promise<void> {
    for (const threadId of threadIds) {
      this.logger.error(`[LoadThreads] Deleting corrupt suggestion thread: ${threadId}`)

      /** First reject the thread with the API, so that the API will allow deletion, since it otherwise won't */
      const rejectResponse = await this.api.changeSuggestionThreadState(
        lookup.volumeId,
        lookup.linkId,
        threadId,
        'reject',
      )
      if (rejectResponse.isFailed()) {
        this.logger.info(`[LoadThreads] Failed to reject corrupt thread: ${rejectResponse.getError()}`)
        return
      }

      void this.api.deleteThread(lookup.volumeId, lookup.linkId, threadId)
    }
  }
}
