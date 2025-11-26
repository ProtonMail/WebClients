import type { CommentType } from '@proton/docs-shared/lib/CommentType'
import type { HttpHeaders } from '../Types/HttpHeaders'
import type { CommentThreadType } from '@proton/docs-shared/lib/CommentThreadType'
import type { CreateThreadResponse } from '../Types/CreateThreadResponse'
import type { ApiResult } from '@proton/docs-shared'
import { DocsApiPrivateRouteBuilder } from '../Routes/DocsApiPrivateRouteBuilder'
import { DocsApiPublicRouteBuilder } from '../Routes/DocsApiPublicRouteBuilder'
import type { RouteExecutor } from '../RouteExecutor'
import type { DocumentEntitlements } from '../../Types/DocumentEntitlements'
import { type PublicDocumentEntitlements, isPublicDocumentEntitlements } from '../../Types/DocumentEntitlements'

export type CreateThreadDTO = {
  markId: string
  encryptedMainCommentContent: string
  type: CommentThreadType
  commentType: CommentType
  decryptedDocumentName: string | null
}

export class ApiCreateThread {
  constructor(
    private readonly executor: RouteExecutor,
    private publicContextHeaders: HttpHeaders | undefined,
  ) {}

  async execute(
    dto: CreateThreadDTO,
    entitlements: PublicDocumentEntitlements | DocumentEntitlements,
  ): Promise<ApiResult<CreateThreadResponse>> {
    if (isPublicDocumentEntitlements(entitlements)) {
      return this.executePublic(dto, entitlements)
    } else {
      return this.executePrivate(dto, entitlements)
    }
  }

  private async executePrivate(
    dto: CreateThreadDTO,
    entitlements: DocumentEntitlements,
  ): Promise<ApiResult<CreateThreadResponse>> {
    const route = new DocsApiPrivateRouteBuilder({
      volumeId: entitlements.nodeMeta.volumeId,
      linkId: entitlements.nodeMeta.linkId,
    }).createThread({
      data: {
        Mark: dto.markId,
        Comment: {
          Type: dto.commentType,
          AuthorEmail: entitlements.keys.userOwnAddress,
          Content: dto.encryptedMainCommentContent,
          DocumentName: dto.decryptedDocumentName,
        },
        Type: dto.type,
      },
    })

    return this.executor.execute(route)
  }

  private async executePublic(
    dto: CreateThreadDTO,
    entitlements: PublicDocumentEntitlements,
  ): Promise<ApiResult<CreateThreadResponse>> {
    if (!this.publicContextHeaders) {
      throw new Error('Public context headers not set')
    }

    const route = new DocsApiPublicRouteBuilder({
      token: entitlements.nodeMeta.token,
      linkId: entitlements.nodeMeta.linkId,
      headers: this.publicContextHeaders,
    }).createThread({
      data: {
        Mark: dto.markId,
        Comment: {
          Type: dto.commentType,
          AuthorEmail: entitlements.keys.userOwnAddress,
          Content: dto.encryptedMainCommentContent,
          DocumentName: dto.decryptedDocumentName,
        },
        Type: dto.type,
      },
    })

    return this.executor.execute(route)
  }
}
