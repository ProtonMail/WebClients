import type { NodeMeta, PublicNodeMeta } from '@proton/drive-store'
import { ApiResult, type RealtimeUrlAndToken } from '@proton/docs-shared'
import type { DocsApi } from '../Api/DocsApi'

export class GetRealtimeUrlAndToken {
  constructor(private docsApi: DocsApi) {}

  async execute(lookup: NodeMeta | PublicNodeMeta, commitId?: string): Promise<ApiResult<RealtimeUrlAndToken>> {
    const result = await this.docsApi.createRealtimeValetToken(lookup, commitId)

    if (result.isFailed()) {
      return ApiResult.fail(result.getError())
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
