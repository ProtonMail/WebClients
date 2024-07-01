import { NodeMeta } from '@proton/drive-store'
import { UseCaseInterface } from '../Domain/UseCase/UseCaseInterface'
import { Result } from '../Domain/Result/Result'
import { DocsApi } from '../Api/DocsApi'
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
