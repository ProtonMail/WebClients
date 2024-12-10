import type { HttpHeaders } from '../Types/HttpHeaders'
import type { GetCommentThreadResponse } from '../Types/GetCommentThreadResponse'
import type { ApiResult } from '@proton/docs-shared'
import { DocsApiPrivateRouteBuilder } from '../Routes/DocsApiPrivateRouteBuilder'
import { DocsApiPublicRouteBuilder } from '../Routes/DocsApiPublicRouteBuilder'
import { isPublicNodeMeta, type NodeMeta, type PublicNodeMeta } from '@proton/drive-store'
import type { RouteExecutor } from '../RouteExecutor'

export class ApiGetThread {
  constructor(
    private readonly executor: RouteExecutor,
    private publicContextHeaders: HttpHeaders | undefined,
  ) {}

  async execute(dto: {
    nodeMeta: NodeMeta | PublicNodeMeta
    threadId: string
  }): Promise<ApiResult<GetCommentThreadResponse>> {
    if (isPublicNodeMeta(dto.nodeMeta)) {
      return this.executePublic(dto, dto.nodeMeta)
    } else {
      return this.executePrivate(dto, dto.nodeMeta)
    }
  }

  private async executePrivate(
    dto: {
      threadId: string
    },
    nodeMeta: NodeMeta,
  ): Promise<ApiResult<GetCommentThreadResponse>> {
    const route = new DocsApiPrivateRouteBuilder({
      volumeId: nodeMeta.volumeId,
      linkId: nodeMeta.linkId,
    }).getThread({
      threadId: dto.threadId,
    })

    return this.executor.execute(route)
  }

  private async executePublic(
    dto: {
      threadId: string
    },
    nodeMeta: PublicNodeMeta,
  ): Promise<ApiResult<GetCommentThreadResponse>> {
    if (!this.publicContextHeaders) {
      throw new Error('Public context headers not set')
    }

    const route = new DocsApiPublicRouteBuilder({
      token: nodeMeta.token,
      linkId: nodeMeta.linkId,
      headers: this.publicContextHeaders,
    }).getThread({
      threadId: dto.threadId,
    })

    return this.executor.execute(route)
  }
}
