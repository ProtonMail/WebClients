import type { NodeMeta, PublicNodeMeta } from '@proton/drive-store'
import { ApiResult } from '@proton/docs-shared'
import type { DocsApi } from '../Api/DocsApi'
import { Commit } from '@proton/docs-proto'
import type { CacheService } from '../Services/CacheService'

/** Gets the raw encrypted commit data based on a commitId */
export class GetCommitData {
  constructor(
    private docsApi: DocsApi,
    private cacheService: CacheService | undefined,
  ) {}

  async execute(nodeMeta: NodeMeta | PublicNodeMeta, commitId: string): Promise<ApiResult<Commit>> {
    if (this.cacheService) {
      const cachedResult = await this.cacheService.getCachedCommit({
        commitId,
      })

      if (!cachedResult.isFailed()) {
        const value = cachedResult.getValue()
        if (value) {
          return ApiResult.ok(value)
        }
      }
    }

    const result = await this.docsApi.getCommitData(nodeMeta, commitId)
    if (result.isFailed()) {
      return ApiResult.fail(result.getErrorObject())
    }

    const commit = Commit.deserialize(result.getValue())

    if (this.cacheService) {
      void this.cacheService.cacheCommit({
        commitId,
        commit,
      })
    }

    return ApiResult.ok(commit)
  }
}
