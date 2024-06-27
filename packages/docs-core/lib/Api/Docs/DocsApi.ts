import { CreateDocumentResponse } from '../Types/CreateDocumentResponse'
import { GetDocumentMetaResponse } from '../Types/GetDocumentMetaResponse'
import { Api } from '@proton/shared/lib/interfaces'
import {
  createDocument,
  createRealtimeValetToken,
  getDocumentMeta,
  getCommitData,
  seedInitialCommit,
  squashCommit,
  lockDocument,
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
import { CreateValetTokenResponse } from '../Types/CreateValetTokenResponse'
import { DocumentMetaInterface } from '@proton/docs-shared'
import { Commit, SquashCommit } from '@proton/docs-proto'
import { NodeMeta } from '@proton/drive-store'
import { getErrorString } from '../../Util/GetErrorString'
import { Result } from '../../Domain/Result/Result'
import { ApiResult } from '../../Domain/Result/ApiResult'
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

export class DocsApi {
  constructor(private protonApi: Api) {
    window.addEventListener('beforeunload', this.handleWindowUnload)
  }

  private inflight: number = 0

  handleWindowUnload = (event: BeforeUnloadEvent): void => {
    if (this.inflight !== 0) {
      event.preventDefault()
    }
  }

  async getDocumentMeta(lookup: NodeMeta): Promise<Result<GetDocumentMetaResponse>> {
    if (!this.protonApi) {
      throw new Error('Proton API not set')
    }

    try {
      this.inflight++
      const response = await this.protonApi(getDocumentMeta(lookup.volumeId, lookup.linkId))
      return Result.ok(response)
    } catch (error) {
      return Result.fail(getErrorString(error) || 'Unknown error')
    } finally {
      this.inflight--
    }
  }

  async getCommitData(lookup: NodeMeta, commitId: string): Promise<Result<Uint8Array>> {
    if (!this.protonApi) {
      throw new Error('Proton API not set')
    }

    try {
      this.inflight++
      const response: Response = await this.protonApi(getCommitData(lookup.volumeId, lookup.linkId, commitId))
      const buffer = await response.arrayBuffer()
      return Result.ok(new Uint8Array(buffer))
    } catch (error) {
      return Result.fail(getErrorString(error) || 'Unknown error')
    } finally {
      this.inflight--
    }
  }

  async seedInitialCommit(docMeta: DocumentMetaInterface, commit: Commit): Promise<Result<Uint8Array>> {
    if (!this.protonApi) {
      throw new Error('Proton API not set')
    }

    try {
      this.inflight++
      const response = await this.protonApi(
        seedInitialCommit(docMeta.volumeId, docMeta.linkId, commit.serializeBinary()),
      )
      return Result.ok(response)
    } catch (error) {
      return Result.fail(getErrorString(error) || 'Unknown error')
    } finally {
      this.inflight--
    }
  }

  async lockDocument(docMeta: DocumentMetaInterface, fetchCommitId?: string): Promise<Result<Uint8Array>> {
    if (!this.protonApi) {
      throw new Error('Proton API not set')
    }

    try {
      this.inflight++
      const response = await this.protonApi(lockDocument(docMeta.volumeId, docMeta.linkId, fetchCommitId))
      const buffer = await response.arrayBuffer()
      return Result.ok(new Uint8Array(buffer))
    } catch (error) {
      return Result.fail(getErrorString(error) || 'Unknown error')
    } finally {
      this.inflight--
    }
  }

  async squashCommit(
    docMeta: DocumentMetaInterface,
    commitId: string,
    squash: SquashCommit,
  ): Promise<Result<Uint8Array>> {
    if (!this.protonApi) {
      throw new Error('Proton API not set')
    }

    try {
      this.inflight++
      const response = await this.protonApi(
        squashCommit(docMeta.volumeId, docMeta.linkId, commitId, squash.serializeBinary()),
      )
      return Result.ok(response)
    } catch (error) {
      return Result.fail(getErrorString(error) || 'Unknown error')
    } finally {
      this.inflight--
    }
  }

  async createDocument(lookup: NodeMeta): Promise<Result<CreateDocumentResponse>> {
    if (!this.protonApi) {
      throw new Error('Proton API not set')
    }

    try {
      this.inflight++
      const response = await this.protonApi(createDocument(lookup.volumeId, lookup.linkId))
      return Result.ok(response)
    } catch (error) {
      return Result.fail(getErrorString(error) || 'Unknown error')
    } finally {
      this.inflight--
    }
  }

  async createRealtimeValetToken(lookup: NodeMeta, commitId?: string): Promise<ApiResult<CreateValetTokenResponse>> {
    if (!this.protonApi) {
      throw new Error('Proton API not set')
    }

    try {
      this.inflight++
      const response = await this.protonApi(createRealtimeValetToken(lookup.volumeId, lookup.linkId, commitId))
      return ApiResult.ok(response)
    } catch (error) {
      const errorCode = getApiError(error).code
      return ApiResult.fail({
        code: errorCode > 0 ? errorCode : 0,
        message: getErrorString(error) || 'Unknown error',
      })
    } finally {
      this.inflight--
    }
  }

  async getAllThreadIDs(volumeId: string, linkId: string): Promise<Result<GetAllThreadIDsResponse>> {
    if (!this.protonApi) {
      throw new Error('Proton API not set')
    }

    try {
      this.inflight++
      const response = await this.protonApi(getAllCommentThreadsInDocument(volumeId, linkId))
      return Result.ok(response)
    } catch (error) {
      return Result.fail(getErrorString(error) || 'Unknown error')
    } finally {
      this.inflight--
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
      this.inflight++
      const response = await this.protonApi(
        createThreadInDocument(volumeId, linkId, {
          Mark: markId,
          Comment: { Content: encryptedMainCommentContent },
        }),
      )
      return Result.ok(response)
    } catch (error) {
      return Result.fail(getErrorString(error) || 'Unknown error')
    } finally {
      this.inflight--
    }
  }

  async getThread(volumeId: string, linkId: string, threadId: string): Promise<Result<GetCommentThreadResponse>> {
    if (!this.protonApi) {
      throw new Error('Proton API not set')
    }

    try {
      this.inflight++
      const response = await this.protonApi(getCommentThreadInDocument(volumeId, linkId, threadId))
      return Result.ok(response)
    } catch (error) {
      return Result.fail(getErrorString(error) || 'Unknown error')
    } finally {
      this.inflight--
    }
  }

  async deleteThread(volumeId: string, linkId: string, threadId: string): Promise<Result<DeleteThreadResponse>> {
    if (!this.protonApi) {
      throw new Error('Proton API not set')
    }

    try {
      this.inflight++
      const response = await this.protonApi(deleteThreadInDocument(volumeId, linkId, threadId))
      return Result.ok(response)
    } catch (error) {
      return Result.fail(getErrorString(error) || 'Unknown error')
    } finally {
      this.inflight--
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
      this.inflight++
      const response = await this.protonApi(
        addCommentToThreadInDocument(volumeId, linkId, threadId, {
          Content: encryptedContent,
          ParentCommentId: parentCommentId,
        }),
      )
      return Result.ok(response)
    } catch (error) {
      return Result.fail(getErrorString(error) || 'Unknown error')
    } finally {
      this.inflight--
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
      this.inflight++
      const response = await this.protonApi(
        editCommentInThreadInDocument(volumeId, linkId, threadId, commentId, {
          Content: encryptedContent,
        }),
      )
      return Result.ok(response)
    } catch (error) {
      return Result.fail(getErrorString(error) || 'Unknown error')
    } finally {
      this.inflight--
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
      this.inflight++
      const response = await this.protonApi(deleteCommentInThreadInDocument(volumeId, linkId, threadId, commentId))
      return Result.ok(response)
    } catch (error) {
      return Result.fail(getErrorString(error) || 'Unknown error')
    } finally {
      this.inflight--
    }
  }

  async resolveThread(volumeId: string, linkId: string, threadId: string): Promise<Result<ResolveThreadResponse>> {
    if (!this.protonApi) {
      throw new Error('Proton API not set')
    }

    try {
      this.inflight++
      const response = await this.protonApi(resolveThreadInDocument(volumeId, linkId, threadId))
      return Result.ok(response)
    } catch (error) {
      return Result.fail(getErrorString(error) || 'Unknown error')
    } finally {
      this.inflight--
    }
  }

  async unresolveThread(volumeId: string, linkId: string, threadId: string): Promise<Result<UnresolveThreadResponse>> {
    if (!this.protonApi) {
      throw new Error('Proton API not set')
    }

    try {
      this.inflight++
      const response = await this.protonApi(unresolveThreadInDocument(volumeId, linkId, threadId))
      return Result.ok(response)
    } catch (error) {
      return Result.fail(getErrorString(error) || 'Unknown error')
    } finally {
      this.inflight--
    }
  }
}
