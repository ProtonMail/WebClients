import { Result } from '@proton/docs-shared'
import type { DocsApi } from '../Api/DocsApi'

import type { DocumentMetaInterface } from '@proton/docs-shared'
import { DocumentMeta } from '../Models/DocumentMeta'
import type { NodeMeta, PublicNodeMeta } from '@proton/drive-store'
import type { DocsApiErrorCode } from '@proton/shared/lib/api/docs'

type ErrorResult = {
  code?: DocsApiErrorCode
  message: string
}

/**
 * Primarily used to look up the CommitIds for a document, so that we can fetch the binary for the commits.
 */
export class GetDocumentMeta {
  constructor(private docsApi: DocsApi) {}

  async execute(lookup: NodeMeta | PublicNodeMeta): Promise<Result<DocumentMetaInterface, ErrorResult>> {
    const result = await this.docsApi.getDocumentMeta(lookup)
    if (result.isFailed()) {
      const error = result.getError()
      return Result.fail({
        code: error.code,
        message: error.message,
      })
    }

    const data = result.getValue().Document

    const meta = new DocumentMeta(data.VolumeID, data.CommitIDs, data.CreateTime, data.ModifyTime)

    return Result.ok<DocumentMetaInterface, ErrorResult>(meta)
  }
}
