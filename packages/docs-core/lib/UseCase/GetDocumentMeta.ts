import { DocumentMeta } from '../Models/DocumentMeta'
import { DynamicResult } from '@proton/docs-shared'
import type { DocsApi } from '../Api/DocsApi'
import type { DocsApiErrorCode } from '@proton/shared/lib/api/docs'
import type { DocumentMetaInterface } from '@proton/docs-shared'
import type { NodeMeta, PublicNodeMeta } from '@proton/drive-store'

type ErrorResult = {
  code?: DocsApiErrorCode
  message: string
}

/**
 * Primarily used to look up the CommitIds for a document, so that we can fetch the binary for the commits.
 */
export class GetDocumentMeta {
  constructor(private docsApi: DocsApi) {}

  async execute(lookup: NodeMeta | PublicNodeMeta): Promise<DynamicResult<DocumentMetaInterface, ErrorResult>> {
    const result = await this.docsApi.getDocumentMeta(lookup)
    if (result.isFailed()) {
      return DynamicResult.fail(result.getErrorObject())
    }

    const data = result.getValue().Document

    const meta = new DocumentMeta(data.VolumeID, data.CommitIDs, data.CreateTime, data.ModifyTime)

    return DynamicResult.ok<DocumentMetaInterface, ErrorResult>(meta)
  }
}
