import type { NodeMeta, PublicNodeMeta } from '@proton/drive-store'
import type { UseCaseInterface } from '../Domain/UseCase/UseCaseInterface'
import { Result } from '@proton/docs-shared'
import type { DocsApi } from '../Api/DocsApi'
import { Commit } from '@proton/docs-proto'

export class GetCommitData implements UseCaseInterface<Commit> {
  constructor(private docsApi: DocsApi) {}

  async execute(lookup: NodeMeta | PublicNodeMeta, commitId: string): Promise<Result<Commit>> {
    const result = await this.docsApi.getCommitData(lookup, commitId)

    if (result.isFailed()) {
      return Result.fail(result.getError().message)
    }

    const commit = Commit.deserialize(result.getValue())

    return Result.ok(commit)
  }
}
