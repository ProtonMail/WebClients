import { Result } from '@standardnotes/domain-core'
import { Api } from '@proton/shared/lib/interfaces'
import {
  addCommentToThreadInDocument,
  createThreadInDocument,
  deleteCommentInThreadInDocument,
  deleteThreadInDocument,
  editCommentInThreadInDocument,
  getAllCommentThreadsInDocument,
  getCommentThreadInDocument,
  resolveThreadInDocument,
  unresolveThreadInDocument,
} from '@proton/shared/lib/api/docs'
import { getApiError } from '@proton/shared/lib/api/helpers/apiErrorHelper'
import {
  GetAllThreadIDsResponse,
  CreateThreadResponse,
  GetCommentThreadResponse,
  DeleteThreadResponse,
  AddCommentToThreadResponse,
  EditCommentResponse,
  DeleteCommentResponse,
  ResolveThreadResponse,
  UnresolveThreadResponse,
} from './Types'

export class CommentsApi {
  constructor(private protonApi: Api) {}

  async getAllThreadIDs(volumeId: string, linkId: string): Promise<Result<GetAllThreadIDsResponse>> {
    if (!this.protonApi) {
      throw new Error('Proton API not set')
    }

    try {
      const response = await this.protonApi(getAllCommentThreadsInDocument(volumeId, linkId))
      return Result.ok(response)
    } catch (error) {
      const apiError = getApiError(error)
      return Result.fail(apiError.message)
    }
  }

  async createThread(
    volumeId: string,
    linkId: string,
    markId: string,
    encryptedMainCommentContent: string,
  ): Promise<Result<CreateThreadResponse>> {
    if (!this.protonApi) {
      throw new Error('Proton API not set')
    }

    try {
      const response = await this.protonApi(
        createThreadInDocument(volumeId, linkId, {
          Mark: markId,
          Comment: { Content: encryptedMainCommentContent },
        }),
      )
      return Result.ok(response)
    } catch (error) {
      const apiError = getApiError(error)
      return Result.fail(apiError.message)
    }
  }

  async getThread(volumeId: string, linkId: string, threadId: string): Promise<Result<GetCommentThreadResponse>> {
    if (!this.protonApi) {
      throw new Error('Proton API not set')
    }

    try {
      const response = await this.protonApi(getCommentThreadInDocument(volumeId, linkId, threadId))
      return Result.ok(response)
    } catch (error) {
      const apiError = getApiError(error)
      return Result.fail(apiError.message)
    }
  }

  async deleteThread(volumeId: string, linkId: string, threadId: string): Promise<Result<DeleteThreadResponse>> {
    if (!this.protonApi) {
      throw new Error('Proton API not set')
    }

    try {
      const response = await this.protonApi(deleteThreadInDocument(volumeId, linkId, threadId))
      return Result.ok(response)
    } catch (error) {
      const apiError = getApiError(error)
      return Result.fail(apiError.message)
    }
  }

  async addCommentToThread(
    volumeId: string,
    linkId: string,
    threadId: string,
    encryptedContent: string,
    parentCommentId: string | null,
  ): Promise<Result<AddCommentToThreadResponse>> {
    if (!this.protonApi) {
      throw new Error('Proton API not set')
    }

    try {
      const response = await this.protonApi(
        addCommentToThreadInDocument(volumeId, linkId, threadId, {
          Content: encryptedContent,
          ParentCommentId: parentCommentId,
        }),
      )
      return Result.ok(response)
    } catch (error) {
      const apiError = getApiError(error)
      return Result.fail(apiError.message)
    }
  }

  async editComment(
    volumeId: string,
    linkId: string,
    threadId: string,
    commentId: string,
    encryptedContent: string,
  ): Promise<Result<EditCommentResponse>> {
    if (!this.protonApi) {
      throw new Error('Proton API not set')
    }

    try {
      const response = await this.protonApi(
        editCommentInThreadInDocument(volumeId, linkId, threadId, commentId, {
          Content: encryptedContent,
        }),
      )
      return Result.ok(response)
    } catch (error) {
      const apiError = getApiError(error)
      return Result.fail(apiError.message)
    }
  }

  async deleteComment(
    volumeId: string,
    linkId: string,
    threadId: string,
    commentId: string,
  ): Promise<Result<DeleteCommentResponse>> {
    if (!this.protonApi) {
      throw new Error('Proton API not set')
    }

    try {
      const response = await this.protonApi(deleteCommentInThreadInDocument(volumeId, linkId, threadId, commentId))
      return Result.ok(response)
    } catch (error) {
      const apiError = getApiError(error)
      return Result.fail(apiError.message)
    }
  }

  async resolveThread(volumeId: string, linkId: string, threadId: string): Promise<Result<ResolveThreadResponse>> {
    if (!this.protonApi) {
      throw new Error('Proton API not set')
    }

    try {
      const response = await this.protonApi(resolveThreadInDocument(volumeId, linkId, threadId))
      return Result.ok(response)
    } catch (error) {
      const apiError = getApiError(error)
      return Result.fail(apiError.message)
    }
  }

  async unresolveThread(volumeId: string, linkId: string, threadId: string): Promise<Result<UnresolveThreadResponse>> {
    if (!this.protonApi) {
      throw new Error('Proton API not set')
    }

    try {
      const response = await this.protonApi(unresolveThreadInDocument(volumeId, linkId, threadId))
      return Result.ok(response)
    } catch (error) {
      const apiError = getApiError(error)
      return Result.fail(apiError.message)
    }
  }
}
