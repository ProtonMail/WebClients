import type { HttpHeaders } from '../Types/HttpHeaders'
import type { EditCommentResponse } from '../Types/EditCommentResponse'
import type { ApiResult } from '@proton/docs-shared'
import { DocsApiPrivateRouteBuilder } from '../Routes/DocsApiPrivateRouteBuilder'
import { DocsApiPublicRouteBuilder } from '../Routes/DocsApiPublicRouteBuilder'
import type { RouteExecutor } from '../RouteExecutor'
import type { PublicDocumentEntitlements } from '../../Types/DocumentEntitlements'
import { isPublicDocumentEntitlements } from '../../Types/DocumentEntitlements'
import type { DocumentEntitlements } from '../../Types/DocumentEntitlements'

export type EditCommentDTO = {
  threadId: string
  commentId: string
  encryptedContent: string
}

export class ApiEditComment {
  constructor(
    private readonly executor: RouteExecutor,
    private publicContextHeaders: HttpHeaders | undefined,
  ) {}

  async execute(
    dto: EditCommentDTO,
    entitlements: PublicDocumentEntitlements | DocumentEntitlements,
  ): Promise<ApiResult<EditCommentResponse>> {
    if (isPublicDocumentEntitlements(entitlements)) {
      return this.executePublic(dto, entitlements)
    } else {
      return this.executePrivate(dto, entitlements)
    }
  }

  private async executePrivate(
    dto: EditCommentDTO,
    entitlements: DocumentEntitlements,
  ): Promise<ApiResult<EditCommentResponse>> {
    const { volumeId, linkId } = entitlements.nodeMeta
    const { threadId, commentId, encryptedContent } = dto
    const authorEmail = entitlements.keys.userOwnAddress

    const route = new DocsApiPrivateRouteBuilder({ volumeId, linkId }).editComment({
      threadId,
      commentId,
      data: {
        Content: encryptedContent,
        AuthorEmail: authorEmail,
      },
    })

    return this.executor.execute(route)
  }

  private async executePublic(
    dto: EditCommentDTO,
    entitlements: PublicDocumentEntitlements,
  ): Promise<ApiResult<EditCommentResponse>> {
    if (!this.publicContextHeaders) {
      throw new Error('Public context headers not set')
    }

    const { token, linkId } = entitlements.nodeMeta

    const route = new DocsApiPublicRouteBuilder({
      token: token,
      linkId: linkId,
      headers: this.publicContextHeaders,
    }).editComment({
      threadId: dto.threadId,
      commentId: dto.commentId,
      data: {
        Content: dto.encryptedContent,
        AuthorEmail: entitlements.keys.userOwnAddress,
      },
    })

    return this.executor.execute(route)
  }
}
