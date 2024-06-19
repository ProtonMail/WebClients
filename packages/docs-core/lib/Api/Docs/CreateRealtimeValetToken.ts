import { NodeMeta } from '@proton/drive-store'
import { DocsApi } from './DocsApi'
import { RealtimeUrlAndToken } from '@proton/docs-shared'
import { ApiResult } from '../../Domain/Result/ApiResult'

export class GetRealtimeUrlAndToken {
  constructor(private docsApi: DocsApi) {}

  async execute(lookup: NodeMeta, commitId?: string): Promise<ApiResult<RealtimeUrlAndToken>> {
    const result = await this.docsApi.createRealtimeValetToken(lookup, commitId)

    if (result.isFailed()) {
      return ApiResult.fail(result.getError())
    }

    const value = result.getValue().ValetToken

    return ApiResult.ok({
      token: value.Token,
    })
  }
}
