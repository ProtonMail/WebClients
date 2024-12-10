import { LoadLogger } from '../LoadLogger/LoadLogger'
import { Result } from '@proton/docs-shared'
import type { Commit } from '@proton/docs-proto'
import type { ApiResult, DocumentMetaInterface, RealtimeUrlAndToken } from '@proton/docs-shared'
import type { GetCommitData } from './GetCommitData'
import type { GetDocumentMeta } from './GetDocumentMeta'
import type { NodeMeta, PublicNodeMeta } from '@proton/drive-store'
import type { FetchRealtimeToken } from './FetchRealtimeToken'

/**
 * Gets the document meta from the server, which contains the latest commit id.
 * Once we have the commit id, we can concurrently fetch encrypted commit data, as well as a realtime token.
 * This use case does not decrypt the commit data.
 */
export class FetchMetaAndRawCommit {
  constructor(
    private getDocumentMeta: GetDocumentMeta,
    private getCommitData: GetCommitData,
    private fetchRealtimeToken: FetchRealtimeToken,
  ) {}

  async execute(nodeMeta: NodeMeta | PublicNodeMeta): Promise<
    Result<{
      serverBasedMeta: DocumentMetaInterface
      latestCommit: Commit | undefined
      realtimeToken: string | undefined
    }>
  > {
    const metaResult = await this.getDocumentMeta
      .execute(nodeMeta)
      .then((result) => {
        LoadLogger.logEventRelativeToLoadTime('[FetchMetaAndRawCommit] Loaded meta')
        return result
      })
      .catch((error) => {
        throw new Error(`Failed to fetch document metadata: ${error}`)
      })

    if (metaResult.isFailed()) {
      return Result.fail(metaResult.getError())
    }

    const serverBasedMeta: DocumentMetaInterface = metaResult.getValue()
    if (!serverBasedMeta) {
      return Result.fail('Document meta not found')
    }

    const latestCommitId = serverBasedMeta.latestCommitId()
    let latestCommit: Commit | undefined

    const promises: Promise<ApiResult<RealtimeUrlAndToken> | ApiResult<Commit>>[] = [
      this.fetchRealtimeToken.execute(nodeMeta, latestCommitId).then((result) => {
        LoadLogger.logEventRelativeToLoadTime('[FetchMetaAndRawCommit] Loaded realtime token')
        return result
      }),
      ...(latestCommitId
        ? [
            this.getCommitData.execute(nodeMeta, latestCommitId).then((result) => {
              LoadLogger.logEventRelativeToLoadTime('[FetchMetaAndRawCommit] Loaded commit')
              return result
            }),
          ]
        : []),
    ]

    const [realtimeTokenResult, commitDataResult] = (await Promise.all(promises)) as [
      ApiResult<RealtimeUrlAndToken>,
      ApiResult<Commit> | undefined,
    ]

    if (commitDataResult?.isFailed()) {
      return Result.fail(`Failed to get commit data ${commitDataResult.getError()}`)
    }

    latestCommit = commitDataResult?.getValue()
    const realtimeToken = realtimeTokenResult.isFailed() ? undefined : realtimeTokenResult.getValue().token

    return Result.ok({
      serverBasedMeta,
      latestCommit,
      realtimeToken,
    })
  }
}
