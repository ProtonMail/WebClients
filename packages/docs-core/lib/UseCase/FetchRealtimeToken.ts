import { ApiResult, type RealtimeTokenResult } from '@proton/docs-shared'
import { DocsApiErrorCode } from '@proton/shared/lib/api/docs'
import metrics from '@proton/metrics/index'
import type { DocsApi } from '../Api/DocsApi'
import type { NodeMeta, PublicNodeMeta } from '@proton/drive-store'

/** Gets a connection token from the Docs API to connect with the RTS */
export class FetchRealtimeToken {
  constructor(private docsApi: DocsApi) {}

  async execute(
    lookup: NodeMeta | PublicNodeMeta,
    commitId: string | undefined,
  ): Promise<ApiResult<RealtimeTokenResult>> {
    const result = await this.docsApi.createRealtimeValetToken(lookup, commitId)
    if (result.isFailed()) {
      if (result.getErrorObject().code === DocsApiErrorCode.CommitIdOutOfSync) {
        metrics.docs_commit_id_out_of_sync_total.increment({})
      }

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
