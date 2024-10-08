import type { Commit, SquashCommit } from '@proton/docs-proto'
import { ApiResult, type DocumentMetaInterface, type SuggestionThreadStateAction } from '@proton/docs-shared'
import type { NodeMeta, PublicNodeMeta } from '@proton/drive-store'
import {
  addCommentToThreadInDocument,
  changeSuggestionThreadState,
  createDocument,
  createRealtimeValetToken,
  createThreadInDocument,
  deleteCommentInThreadInDocument,
  deleteThreadInDocument,
  editCommentInThreadInDocument,
  getAllCommentThreadsInDocument,
  getCommentThreadInDocument,
  getCommitData,
  getCommitDataByToken,
  getDocumentMeta,
  getDocumentMetaByToken,
  lockDocument,
  resolveThreadInDocument,
  seedInitialCommit,
  squashCommit,
  unresolveThreadInDocument,
} from '@proton/shared/lib/api/docs'
import { getApiError } from '@proton/shared/lib/api/helpers/apiErrorHelper'
import { forgeImageURL } from '@proton/shared/lib/helpers/image'
import type { Api } from '@proton/shared/lib/interfaces'
import { Result } from '../Domain/Result/Result'
import { getErrorString } from '../Util/GetErrorString'
import type { AddCommentToThreadResponse } from './Types/AddCommentToThreadResponse'
import type { CreateDocumentResponse } from './Types/CreateDocumentResponse'
import type { CreateThreadResponse } from './Types/CreateThreadResponse'
import type { CreateValetTokenResponse } from './Types/CreateValetTokenResponse'
import type { DeleteCommentResponse } from './Types/DeleteCommentResponse'
import type { DeleteThreadResponse } from './Types/DeleteThreadResponse'
import type { EditCommentResponse } from './Types/EditCommentResponse'
import type { GetAllThreadIDsResponse } from './Types/GetAllThreadIDsResponse'
import type { GetCommentThreadResponse } from './Types/GetCommentThreadResponse'
import type { GetDocumentMetaResponse } from './Types/GetDocumentMetaResponse'
import type { ImageProxyParams } from './Types/ImageProxyParams'
import type { ResolveThreadResponse } from './Types/ResolveThreadResponse'
import type { SeedInitialCommitApiResponse } from './Types/SeedInitialCommitApiResponse'
import type { UnresolveThreadResponse } from './Types/UnresolveThreadResponse'
import type { CommentThreadType, CommentType } from '@proton/docs-shared'
import { isPublicNodeMeta } from '@proton/drive-store/lib/interface'

export type HttpHeaders = { [key: string]: string }

export class DocsApi {
  constructor(
    private protonApi: Api,
    /** Headers to use when fetching public documents */
    private publicContextHeaders: HttpHeaders | undefined,
    private imageProxyParams: ImageProxyParams | undefined,
  ) {
    window.addEventListener('beforeunload', this.handleWindowUnload)
  }

  private inflight: number = 0

  handleWindowUnload = (event: BeforeUnloadEvent): void => {
    if (this.inflight !== 0) {
      event.preventDefault()
    }
  }

  async getDocumentMeta(lookup: NodeMeta | PublicNodeMeta): Promise<Result<GetDocumentMetaResponse>> {
    if (!this.protonApi) {
      throw new Error('Proton API not set')
    }

    if (isPublicNodeMeta(lookup) && !this.publicContextHeaders) {
      throw new Error('Public context headers not set')
    }

    try {
      this.inflight++
      const response = await this.protonApi(
        isPublicNodeMeta(lookup)
          ? getDocumentMetaByToken(lookup.linkId, lookup.token, this.publicContextHeaders!)
          : getDocumentMeta(lookup.volumeId, lookup.linkId),
      )
      return Result.ok(response)
    } catch (error) {
      return Result.fail(getErrorString(error) || 'Unknown error')
    } finally {
      this.inflight--
    }
  }

  async getCommitData(lookup: NodeMeta | PublicNodeMeta, commitId: string): Promise<Result<Uint8Array>> {
    if (!this.protonApi) {
      throw new Error('Proton API not set')
    }

    if (isPublicNodeMeta(lookup) && !this.publicContextHeaders) {
      throw new Error('Public context headers not set')
    }

    try {
      this.inflight++
      const response: Response = await this.protonApi(
        isPublicNodeMeta(lookup)
          ? getCommitDataByToken(lookup.linkId, lookup.token, commitId, this.publicContextHeaders!)
          : getCommitData(lookup.volumeId, lookup.linkId, commitId),
      )
      const buffer = await response.arrayBuffer()
      return Result.ok(new Uint8Array(buffer))
    } catch (error) {
      return Result.fail(getErrorString(error) || 'Unknown error')
    } finally {
      this.inflight--
    }
  }

  async seedInitialCommit(
    docMeta: DocumentMetaInterface['nodeMeta'],
    commit: Commit,
  ): Promise<Result<SeedInitialCommitApiResponse>> {
    if (!this.protonApi) {
      throw new Error('Proton API not set')
    }

    if (isPublicNodeMeta(docMeta)) {
      throw new Error('Cannot seed initial commit for public node')
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

    if (isPublicNodeMeta(docMeta.nodeMeta)) {
      throw new Error('Cannot lock public node')
    }

    try {
      this.inflight++
      const response = await this.protonApi(
        lockDocument(docMeta.nodeMeta.volumeId, docMeta.nodeMeta.linkId, fetchCommitId),
      )
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

    if (isPublicNodeMeta(docMeta.nodeMeta)) {
      throw new Error('Cannot squash commit for public node')
    }

    try {
      this.inflight++
      const response = await this.protonApi(
        squashCommit(docMeta.nodeMeta.volumeId, docMeta.nodeMeta.linkId, commitId, squash.serializeBinary()),
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

  async createThread(dto: {
    volumeId: string
    linkId: string
    markId: string
    encryptedMainCommentContent: string
    authorEmail: string
    type: CommentThreadType
    commentType: CommentType
  }): Promise<Result<CreateThreadResponse>> {
    if (!this.protonApi) {
      throw new Error('Proton API not set')
    }

    const { volumeId, linkId, markId, encryptedMainCommentContent, authorEmail, type, commentType } = dto

    try {
      this.inflight++
      const response = await this.protonApi(
        createThreadInDocument(volumeId, linkId, {
          Mark: markId,
          Comment: { Content: encryptedMainCommentContent, AuthorEmail: authorEmail, Type: commentType },
          Type: type,
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

  async addCommentToThread(dto: {
    volumeId: string
    linkId: string
    threadId: string
    encryptedContent: string
    parentCommentId: string | null
    authorEmail: string
    type: CommentType
  }): Promise<Result<AddCommentToThreadResponse>> {
    if (!this.protonApi) {
      throw new Error('Proton API not set')
    }

    const { volumeId, linkId, threadId, encryptedContent, parentCommentId, authorEmail, type } = dto

    try {
      this.inflight++
      const response = await this.protonApi(
        addCommentToThreadInDocument(volumeId, linkId, threadId, {
          Content: encryptedContent,
          ParentCommentId: parentCommentId,
          AuthorEmail: authorEmail,
          Type: type,
        }),
      )
      return Result.ok(response)
    } catch (error) {
      return Result.fail(getErrorString(error) || 'Unknown error')
    } finally {
      this.inflight--
    }
  }

  async editComment(dto: {
    volumeId: string
    linkId: string
    threadId: string
    commentId: string
    encryptedContent: string
    authorEmail: string
  }): Promise<Result<EditCommentResponse>> {
    if (!this.protonApi) {
      throw new Error('Proton API not set')
    }

    const { volumeId, linkId, threadId, commentId, encryptedContent, authorEmail } = dto

    try {
      this.inflight++
      const response = await this.protonApi(
        editCommentInThreadInDocument(volumeId, linkId, threadId, commentId, {
          Content: encryptedContent,
          AuthorEmail: authorEmail,
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

  async changeSuggestionThreadState(
    volumeId: string,
    linkId: string,
    threadId: string,
    action: SuggestionThreadStateAction,
  ): Promise<Result<UnresolveThreadResponse>> {
    if (!this.protonApi) {
      throw new Error('Proton API not set')
    }

    try {
      this.inflight++
      const response = await this.protonApi(changeSuggestionThreadState(volumeId, linkId, threadId, action))
      return Result.ok(response)
    } catch (error) {
      return Result.fail(getErrorString(error) || 'Unknown error')
    } finally {
      this.inflight--
    }
  }

  async fetchExternalImageAsBase64(url: string): Promise<Result<string>> {
    if (!this.imageProxyParams) {
      return Result.fail('Image proxy params not set')
    }

    try {
      this.inflight++
      const forgedImageURL = forgeImageURL({
        url,
        origin: window.location.origin,
        apiUrl: this.imageProxyParams.apiUrl,
        uid: this.imageProxyParams.uid,
      })
      const response = await fetch(forgedImageURL)
      const blob = await response.blob()
      if (!blob.type.startsWith('image/')) {
        return Result.fail('Not an image')
      }
      const reader = new FileReader()
      const base64 = await new Promise<string>((resolve) => {
        reader.onload = () => {
          resolve(reader.result as string)
        }
        reader.readAsDataURL(blob)
      })
      if (typeof base64 !== 'string') {
        return Result.fail('Failed to convert image to base64')
      }
      return Result.ok(base64)
    } catch (error) {
      return Result.fail(getErrorString(error) || 'Unknown error')
    } finally {
      this.inflight--
    }
  }
}
