import { LoadLogger } from '../LoadLogger/LoadLogger'
import type { Commit } from '@proton/docs-proto'
import { DynamicResult } from '@proton/docs-shared'
import type { ApiResult, DocumentMetaInterface, RealtimeTokenResult } from '@proton/docs-shared'
import type { GetCommitData } from './GetCommitData'
import type { GetDocumentMeta } from './GetDocumentMeta'
import type { NodeMeta, PublicNodeMeta } from '@proton/drive-store'
import type { FetchRealtimeToken } from './FetchRealtimeToken'
import type { DocsApiErrorCode } from '@proton/shared/lib/api/docs'

type ErrorResult = {
  message: string
  code?: DocsApiErrorCode
}

type SuccessResult = {
  serverBasedMeta: DocumentMetaInterface
  latestCommit: Commit | undefined
  realtimeToken: RealtimeTokenResult | undefined
}

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

  async execute(nodeMeta: NodeMeta | PublicNodeMeta): Promise<DynamicResult<SuccessResult, ErrorResult>> {
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
      return DynamicResult.fail(metaResult.getErrorObject())
    }

    const serverBasedMeta: DocumentMetaInterface = metaResult.getValue()

    const latestCommitId = serverBasedMeta.latestCommitId()

    const promises: Promise<ApiResult<RealtimeTokenResult> | ApiResult<Commit>>[] = [
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
      ApiResult<RealtimeTokenResult>,
      ApiResult<Commit> | undefined,
    ]

    if (commitDataResult?.isFailed()) {
      return DynamicResult.fail({
        reason: 'unknown',
        message: `Failed to get commit data ${commitDataResult.getErrorMessage()}`,
      })
    }

    const latestCommit: Commit | undefined = commitDataResult?.getValue()
    const realtimeToken = realtimeTokenResult.isFailed() ? undefined : realtimeTokenResult.getValue()

    return DynamicResult.ok({
      serverBasedMeta,
      latestCommit,
      realtimeToken,
    })
  }
}
