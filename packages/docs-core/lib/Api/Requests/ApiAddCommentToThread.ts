import type { ApiResult, CommentType } from '@proton/docs-shared'
import type { HttpHeaders } from '../Types/HttpHeaders'
import type { AddCommentToThreadResponse } from '../Types/AddCommentToThreadResponse'
import { DocsApiPrivateRouteBuilder } from '../Routes/DocsApiPrivateRouteBuilder'
import { DocsApiPublicRouteBuilder } from '../Routes/DocsApiPublicRouteBuilder'
import type { RouteExecutor } from '../RouteExecutor'
import type { DocumentEntitlements } from '../../Types/DocumentEntitlements'
import { isPublicDocumentEntitlements } from '../../Types/DocumentEntitlements'
import type { PublicDocumentEntitlements } from '../../Types/DocumentEntitlements'

export type AddCommentToThreadDTO = {
  threadId: string
  encryptedContent: string
  parentCommentId: string | null
  type: CommentType
  decryptedDocumentName: string | null
}

export class ApiAddCommentToThread {
  constructor(
    private readonly executor: RouteExecutor,
    private publicContextHeaders: HttpHeaders | undefined,
  ) {}

  async execute(
    common: AddCommentToThreadDTO,
    entitlements: PublicDocumentEntitlements | DocumentEntitlements,
  ): Promise<ApiResult<AddCommentToThreadResponse>> {
    if (isPublicDocumentEntitlements(entitlements)) {
      return this.executePublic(common, entitlements)
    } else {
      return this.executePrivate(common, entitlements)
    }
  }

  private async executePrivate(
    dto: AddCommentToThreadDTO,
    entitlements: DocumentEntitlements,
  ): Promise<ApiResult<AddCommentToThreadResponse>> {
    const route = new DocsApiPrivateRouteBuilder({
      volumeId: entitlements.nodeMeta.volumeId,
      linkId: entitlements.nodeMeta.linkId,
    }).addComment({
      threadId: dto.threadId,
      data: {
        Type: dto.type,
        ParentCommentId: dto.parentCommentId,
        DocumentName: dto.decryptedDocumentName,
        Content: dto.encryptedContent,
        AuthorEmail: entitlements.keys.userOwnAddress,
      },
    })

    return this.executor.execute(route)
  }

  private async executePublic(
    dto: AddCommentToThreadDTO,
    entitlements: PublicDocumentEntitlements,
  ): Promise<ApiResult<AddCommentToThreadResponse>> {
    if (!this.publicContextHeaders) {
      throw new Error('Public context headers not set')
    }

    const route = new DocsApiPublicRouteBuilder({
      token: entitlements.nodeMeta.token,
      linkId: entitlements.nodeMeta.linkId,
      headers: this.publicContextHeaders,
    }).addComment({
      threadId: dto.threadId,
      data: {
        Type: dto.type,
        ParentCommentId: dto.parentCommentId,
        DocumentName: dto.decryptedDocumentName,
        Content: dto.encryptedContent,
      },
    })

    return this.executor.execute(route)
  }
}
