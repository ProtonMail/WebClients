import { NodeMeta } from '@proton/drive-store'
import { Result, UseCaseInterface } from '@standardnotes/domain-core'
import { DocsApi } from './DocsApi'
import { RealtimeUrlAndToken } from '@proton/docs-shared'

export class GetRealtimeUrlAndToken implements UseCaseInterface<RealtimeUrlAndToken> {
  constructor(private docsApi: DocsApi) {}

  async execute(lookup: NodeMeta, commitId?: string): Promise<Result<RealtimeUrlAndToken>> {
    const result = await this.docsApi.createRealtimeValetToken(lookup, commitId)

    if (result.isFailed()) {
      return Result.fail(result.getError())
    }

    const value = result.getValue().ValetToken

    return Result.ok({
      token: value.Token,
      url: value.RtsApiUrl,
    })
  }
}
