import { Result, UseCaseInterface } from '@standardnotes/domain-core'
import { DocsApi } from '../Api/Docs/DocsApi'

import { DocumentMetaInterface } from '@proton/docs-shared'
import { DocumentMeta } from '../Models/DocumentMeta'
import { NodeMeta } from '@proton/drive-store'

/**
 * Primarily used to look up the CommitIds for a document, so that we can fetch the binary for the commits.
 */
export class GetDocumentMeta implements UseCaseInterface<DocumentMetaInterface> {
  constructor(private docsApi: DocsApi) {}

  async execute(lookup: NodeMeta): Promise<Result<DocumentMetaInterface>> {
    const result = await this.docsApi.getDocumentMeta(lookup)

    if (result.isFailed()) {
      return Result.fail(result.getError())
    }

    const data = result.getValue().Document

    const meta = new DocumentMeta(lookup.volumeId, lookup.linkId, data.CommitIDs, data.CreateTime, data.ModifyTime, '')

    return Result.ok(meta)
  }
}
