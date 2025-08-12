import { DocsApiPrivateRouteBuilder } from './Routes/DocsApiPrivateRouteBuilder'
import { DocsApiPublicRouteBuilder } from './Routes/DocsApiPublicRouteBuilder'
import { DocsApiRouteBuilder } from './Routes/DocsApiRouteBuilder'
import { forgeImageURL } from '@proton/shared/lib/helpers/image'
import { getErrorString } from '../Util/GetErrorString'
import { isPublicNodeMeta } from '@proton/drive-store'
import { Result } from '@proton/docs-shared'
import { type ApiAddCommentToThread } from './Requests/ApiAddCommentToThread'
import { type SuggestionThreadStateAction } from '@proton/docs-shared'
import type { AddCommentToThreadDTO } from './Requests/ApiAddCommentToThread'
import type { AddCommentToThreadResponse } from './Types/AddCommentToThreadResponse'
import type { ApiCreateThread, CreateThreadDTO } from './Requests/ApiCreateThread'
import type { ApiEditComment, EditCommentDTO } from './Requests/ApiEditComment'
import type { ApiGetThread } from './Requests/ApiGetThread'
import type { ApiResult } from '@proton/docs-shared'
import type { Commit, SquashCommit } from '@proton/docs-proto'
import type { CreateDocumentResponse } from './Types/CreateDocumentResponse'
import type { CreateThreadResponse } from './Types/CreateThreadResponse'
import type { CreateValetTokenResponse } from './Types/CreateValetTokenResponse'
import type { DeleteCommentResponse } from './Types/DeleteCommentResponse'
import type { DeleteThreadResponse } from './Types/DeleteThreadResponse'
import type { DocumentEntitlements } from '../Types/DocumentEntitlements'
import type { EditCommentResponse } from './Types/EditCommentResponse'
import type { GetAllThreadIDsResponse } from './Types/GetAllThreadIDsResponse'
import type { GetCommentThreadResponse } from './Types/GetCommentThreadResponse'
import type { GetDocumentMetaResponse } from './Types/GetDocumentMetaResponse'
import type { GetRecentsResponse } from './Types/GetRecentsResponse'
import type { HttpHeaders } from './Types/HttpHeaders'
import type { ImageProxyParams } from './Types/ImageProxyParams'
import type { NodeMeta, PublicNodeMeta } from '@proton/drive-store'
import type { PublicDocumentEntitlements } from '../Types/DocumentEntitlements'
import type { ResolveThreadResponse } from './Types/ResolveThreadResponse'
import type { RouteExecutor } from './RouteExecutor'
import type { SeedInitialCommitApiResponse } from './Types/SeedInitialCommitApiResponse'
import type { UnresolveThreadResponse } from './Types/UnresolveThreadResponse'

export class DocsApi {
  constructor(
    private routeExecutor: RouteExecutor,
    /** Headers to use when fetching public documents */
    private publicContextHeaders: HttpHeaders | undefined,
    private imageProxyParams: ImageProxyParams | undefined,
    private apiCreateThread: ApiCreateThread,
    private apiAddCommentToThread: ApiAddCommentToThread,
    private apiGetThread: ApiGetThread,
    private apiEditComment: ApiEditComment,
  ) {
    window.addEventListener('beforeunload', this.handleWindowUnload)
  }

  /**
   * Resets the route executor's inflight requests count so that
   * the user is not shown a confirmation popup when the page is
   * being unloaded. This is needed when redirecting since it will
   * otherwise block from redirecting until the user presses ok.
   */
  resetInflightCount = () => {
    this.routeExecutor.inflight = 0
  }

  handleWindowUnload = (event: BeforeUnloadEvent): void => {
    if (this.routeExecutor.inflight !== 0) {
      event.preventDefault()
    }
  }

  async getDocumentMeta(lookup: NodeMeta | PublicNodeMeta): Promise<ApiResult<GetDocumentMetaResponse>> {
    if (isPublicNodeMeta(lookup) && !this.publicContextHeaders) {
      throw new Error('Public context headers not set')
    }

    const route = isPublicNodeMeta(lookup)
      ? new DocsApiPublicRouteBuilder({
          token: lookup.token,
          linkId: lookup.linkId,
          headers: this.publicContextHeaders!,
        }).meta()
      : new DocsApiPrivateRouteBuilder({ volumeId: lookup.volumeId, linkId: lookup.linkId }).meta()

    return this.routeExecutor.execute(route)
  }

  async getCommitData(lookup: NodeMeta | PublicNodeMeta, commitId: string): Promise<ApiResult<Uint8Array<ArrayBuffer>>> {
    if (isPublicNodeMeta(lookup) && !this.publicContextHeaders) {
      throw new Error('Public context headers not set')
    }

    const route = isPublicNodeMeta(lookup)
      ? new DocsApiPublicRouteBuilder({
          token: lookup.token,
          linkId: lookup.linkId,
          headers: this.publicContextHeaders!,
        }).commit({ commitId })
      : new DocsApiPrivateRouteBuilder({ volumeId: lookup.volumeId, linkId: lookup.linkId }).commit({ commitId })

    return this.routeExecutor.execute(route)
  }

  async fetchRecentDocuments(): Promise<ApiResult<GetRecentsResponse>> {
    const route = new DocsApiRouteBuilder('docs').recentDocuments()
    return this.routeExecutor.execute(route)
  }

  async seedInitialCommit(docMeta: NodeMeta, commit: Commit): Promise<ApiResult<SeedInitialCommitApiResponse>> {
    if (isPublicNodeMeta(docMeta)) {
      throw new Error('Cannot seed initial commit for public node')
    }

    const route = new DocsApiPrivateRouteBuilder({
      volumeId: docMeta.volumeId,
      linkId: docMeta.linkId,
    }).seedInitialCommit({
      data: commit.serializeBinary() as Uint8Array<ArrayBuffer>,
    })

    return this.routeExecutor.execute(route)
  }

  async lockDocument(nodeMeta: NodeMeta, fetchCommitId?: string): Promise<ApiResult<Uint8Array<ArrayBuffer>>> {
    const route = new DocsApiPrivateRouteBuilder({
      volumeId: nodeMeta.volumeId,
      linkId: nodeMeta.linkId,
    }).lock({ fetchCommitId })

    return this.routeExecutor.execute(route)
  }

  async squashCommit(nodeMeta: NodeMeta, commitId: string, squash: SquashCommit): Promise<ApiResult<Uint8Array<ArrayBuffer>>> {
    const route = new DocsApiPrivateRouteBuilder({
      volumeId: nodeMeta.volumeId,
      linkId: nodeMeta.linkId,
    }).squashCommit({ commitId, data: squash.serializeBinary() as Uint8Array<ArrayBuffer> })

    return this.routeExecutor.execute(route)
  }

  async createDocument(lookup: NodeMeta): Promise<ApiResult<CreateDocumentResponse>> {
    const route = new DocsApiPrivateRouteBuilder({
      volumeId: lookup.volumeId,
      linkId: lookup.linkId,
    }).createDocument()

    return this.routeExecutor.execute(route)
  }

  async createRealtimeValetToken(
    lookup: NodeMeta | PublicNodeMeta,
    commitId?: string,
  ): Promise<ApiResult<CreateValetTokenResponse>> {
    if (isPublicNodeMeta(lookup) && !this.publicContextHeaders) {
      throw new Error('Public context headers not set')
    }

    const route = isPublicNodeMeta(lookup)
      ? new DocsApiPublicRouteBuilder({
          token: lookup.token,
          linkId: lookup.linkId,
          headers: this.publicContextHeaders!,
        }).createRealtimeValetToken({ commitId })
      : new DocsApiPrivateRouteBuilder({ volumeId: lookup.volumeId, linkId: lookup.linkId }).createRealtimeValetToken({
          commitId,
        })

    return this.routeExecutor.execute(route)
  }

  async getAllThreadIDs(nodeMeta: NodeMeta | PublicNodeMeta): Promise<ApiResult<GetAllThreadIDsResponse>> {
    if (isPublicNodeMeta(nodeMeta) && !this.publicContextHeaders) {
      throw new Error('Public context headers not set')
    }

    const route = isPublicNodeMeta(nodeMeta)
      ? new DocsApiPublicRouteBuilder({
          token: nodeMeta.token,
          linkId: nodeMeta.linkId,
          headers: this.publicContextHeaders!,
        }).getCommentThreads()
      : new DocsApiPrivateRouteBuilder({ volumeId: nodeMeta.volumeId, linkId: nodeMeta.linkId }).getCommentThreads()

    return this.routeExecutor.execute(route)
  }

  async createThread(
    dto: CreateThreadDTO,
    entitlements: PublicDocumentEntitlements | DocumentEntitlements,
  ): Promise<ApiResult<CreateThreadResponse>> {
    const result = await this.apiCreateThread.execute(dto, entitlements)
    return result
  }

  async getThread(dto: {
    nodeMeta: NodeMeta | PublicNodeMeta
    threadId: string
  }): Promise<ApiResult<GetCommentThreadResponse>> {
    const result = await this.apiGetThread.execute(dto)
    return result
  }

  async deleteThread(dto: {
    nodeMeta: NodeMeta | PublicNodeMeta
    threadId: string
  }): Promise<ApiResult<DeleteThreadResponse>> {
    if (isPublicNodeMeta(dto.nodeMeta) && !this.publicContextHeaders) {
      throw new Error('Public context headers not set')
    }

    const route = isPublicNodeMeta(dto.nodeMeta)
      ? new DocsApiPublicRouteBuilder({
          token: dto.nodeMeta.token,
          linkId: dto.nodeMeta.linkId,
          headers: this.publicContextHeaders!,
        }).deleteThread({ threadId: dto.threadId })
      : new DocsApiPrivateRouteBuilder({
          volumeId: dto.nodeMeta.volumeId,
          linkId: dto.nodeMeta.linkId,
        }).deleteThread({ threadId: dto.threadId })

    return this.routeExecutor.execute(route)
  }

  async addCommentToThread(
    dto: AddCommentToThreadDTO,
    entitlements: PublicDocumentEntitlements | DocumentEntitlements,
  ): Promise<ApiResult<AddCommentToThreadResponse>> {
    const result = await this.apiAddCommentToThread.execute(dto, entitlements)
    return result
  }

  async editComment(
    dto: EditCommentDTO,
    entitlements: PublicDocumentEntitlements | DocumentEntitlements,
  ): Promise<ApiResult<EditCommentResponse>> {
    const result = await this.apiEditComment.execute(dto, entitlements)
    return result
  }

  async deleteComment(dto: {
    nodeMeta: NodeMeta | PublicNodeMeta
    threadId: string
    commentId: string
  }): Promise<ApiResult<DeleteCommentResponse>> {
    if (isPublicNodeMeta(dto.nodeMeta) && !this.publicContextHeaders) {
      throw new Error('Public context headers not set')
    }

    const route = isPublicNodeMeta(dto.nodeMeta)
      ? new DocsApiPublicRouteBuilder({
          token: dto.nodeMeta.token,
          linkId: dto.nodeMeta.linkId,
          headers: this.publicContextHeaders!,
        }).deleteComment({ threadId: dto.threadId, commentId: dto.commentId })
      : new DocsApiPrivateRouteBuilder({ volumeId: dto.nodeMeta.volumeId, linkId: dto.nodeMeta.linkId }).deleteComment({
          threadId: dto.threadId,
          commentId: dto.commentId,
        })

    return this.routeExecutor.execute(route)
  }

  async resolveThread(dto: {
    nodeMeta: NodeMeta | PublicNodeMeta
    threadId: string
  }): Promise<ApiResult<ResolveThreadResponse>> {
    if (isPublicNodeMeta(dto.nodeMeta) && !this.publicContextHeaders) {
      throw new Error('Public context headers not set')
    }

    const route = isPublicNodeMeta(dto.nodeMeta)
      ? new DocsApiPublicRouteBuilder({
          token: dto.nodeMeta.token,
          linkId: dto.nodeMeta.linkId,
          headers: this.publicContextHeaders!,
        }).resolveThread({ threadId: dto.threadId })
      : new DocsApiPrivateRouteBuilder({ volumeId: dto.nodeMeta.volumeId, linkId: dto.nodeMeta.linkId }).resolveThread({
          threadId: dto.threadId,
        })

    return this.routeExecutor.execute(route)
  }

  async unresolveThread(dto: {
    nodeMeta: NodeMeta | PublicNodeMeta
    threadId: string
  }): Promise<ApiResult<UnresolveThreadResponse>> {
    if (isPublicNodeMeta(dto.nodeMeta) && !this.publicContextHeaders) {
      throw new Error('Public context headers not set')
    }

    const route = isPublicNodeMeta(dto.nodeMeta)
      ? new DocsApiPublicRouteBuilder({
          token: dto.nodeMeta.token,
          linkId: dto.nodeMeta.linkId,
          headers: this.publicContextHeaders!,
        }).unresolveThread({ threadId: dto.threadId })
      : new DocsApiPrivateRouteBuilder({
          volumeId: dto.nodeMeta.volumeId,
          linkId: dto.nodeMeta.linkId,
        }).unresolveThread({
          threadId: dto.threadId,
        })

    return this.routeExecutor.execute(route)
  }

  async changeSuggestionThreadState(dto: {
    nodeMeta: NodeMeta | PublicNodeMeta
    threadId: string
    action: SuggestionThreadStateAction
  }): Promise<ApiResult<UnresolveThreadResponse>> {
    if (isPublicNodeMeta(dto.nodeMeta) && !this.publicContextHeaders) {
      throw new Error('Public context headers not set')
    }

    const route = isPublicNodeMeta(dto.nodeMeta)
      ? new DocsApiPublicRouteBuilder({
          token: dto.nodeMeta.token,
          linkId: dto.nodeMeta.linkId,
          headers: this.publicContextHeaders!,
        }).changeSuggestionState({ threadId: dto.threadId, action: dto.action })
      : new DocsApiPrivateRouteBuilder({
          volumeId: dto.nodeMeta.volumeId,
          linkId: dto.nodeMeta.linkId,
        }).changeSuggestionState({
          threadId: dto.threadId,
          action: dto.action,
        })

    return this.routeExecutor.execute(route)
  }

  async fetchExternalImageAsBase64(url: string): Promise<Result<string>> {
    if (!this.imageProxyParams) {
      return Result.fail('Image proxy params not set')
    }

    try {
      this.routeExecutor.inflight++
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
      this.routeExecutor.inflight--
    }
  }
}
