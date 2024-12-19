import { CommentThread } from '../Models'
import { CommentThreadType, CommentType, ServerTime } from '@proton/docs-shared'
import { Result } from '@proton/docs-shared'
import metrics from '@proton/metrics'
import type { DecryptComment } from './DecryptComment'
import type { DocsApi } from '../Api/DocsApi'
import type { DocumentEntitlements, PublicDocumentEntitlements } from '../Types/DocumentEntitlements'
import type { LocalCommentsState } from '../Services/Comments/LocalCommentsState'
import type { LoggerInterface } from '@proton/utils/logs'
import type { NodeMeta } from '@proton/drive-store'
import type { UseCaseInterface } from '../Domain/UseCase/UseCaseInterface'
import { isPrivateNodeMeta } from '@proton/drive-store'

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

    await Promise.all(
      response.CommentThreads.map(async (threadID) => {
        return this.loadThread({ threadID, entitlements: dto.entitlements, commentsState: dto.commentsState })
      }),
    )

    dto.commentsState.sortThreadsAndNotify()

    return Result.ok()
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
    const corruptThreadIds: Set<string> = new Set()

    const comments = await Promise.all(
      commentThreadDto.Comments.map(async (commentDto) => {
        const result = await this.decryptComment.execute(commentDto, commentThreadDto.Mark, dto.entitlements.keys)
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

    if (corruptThreadIds.size > 0 && isPrivateNodeMeta(dto.entitlements.nodeMeta)) {
      void this.deleteCorruptSuggestionThreads(Array.from(corruptThreadIds), dto.entitlements.nodeMeta)

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
      commentThreadDto.CommentThreadID,
    )

    dto.commentsState.addThread(localThread)

    return Result.ok()
  }

  private async deleteCorruptSuggestionThreads(threadIds: string[], nodeMeta: NodeMeta): Promise<void> {
    for (const threadId of threadIds) {
      this.logger.error(`[LoadThreads] Deleting corrupt suggestion thread: ${threadId}`)

      /** First reject the thread with the API, so that the API will allow deletion, since it otherwise won't */
      const rejectResponse = await this.api.changeSuggestionThreadState({
        nodeMeta: {
          volumeId: nodeMeta.volumeId,
          linkId: nodeMeta.linkId,
        },
        threadId,
        action: 'reject',
      })

      if (rejectResponse.isFailed()) {
        this.logger.info(`[LoadThreads] Failed to reject corrupt thread: ${rejectResponse.getErrorMessage()}`)
        return
      }

      void this.api.deleteThread({
        nodeMeta: {
          volumeId: nodeMeta.volumeId,
          linkId: nodeMeta.linkId,
        },
        threadId,
      })
    }
  }
}
