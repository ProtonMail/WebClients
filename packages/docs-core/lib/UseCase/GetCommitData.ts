import { NodeMeta } from '@proton/drive-store'
import { Result, UseCaseInterface } from '@standardnotes/domain-core'
import { DocsApi } from '../Api/Docs/DocsApi'
import { Commit } from '@proton/docs-proto'

export class GetCommitData implements UseCaseInterface<Commit> {
  constructor(private docsApi: DocsApi) {}

  async execute(lookup: NodeMeta, commitId: string): Promise<Result<Commit>> {
    const result = await this.docsApi.getCommitData(lookup, commitId)

    if (result.isFailed()) {
      return Result.fail(result.getError())
    }

    const commit = Commit.deserialize(result.getValue())

    return Result.ok(commit)
  }
}
