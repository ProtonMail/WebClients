import type { NodeMeta, PublicNodeMeta } from '@proton/drive-store'
import { ApiResult, type RealtimeUrlAndToken } from '@proton/docs-shared'
import type { DocsApi } from '../Api/DocsApi'

/** Gets a connection token from the Docs API to connect with the RTS */
export class FetchRealtimeToken {
  constructor(private docsApi: DocsApi) {}

  async execute(
    lookup: NodeMeta | PublicNodeMeta,
    commitId: string | undefined,
  ): Promise<ApiResult<RealtimeUrlAndToken>> {
    const result = await this.docsApi.createRealtimeValetToken(lookup, commitId)
    if (result.isFailed()) {
      return ApiResult.fail(result.getErrorObject())
    }

    const value = result.getValue().ValetToken

    return ApiResult.ok({
      token: value.Token,
      preferences: {
        includeDocumentNameInEmails: value.Preferences.find((p) => p.Name === 'IncludeDocumentName')?.Value ?? false,
      },
    })
  }
}
