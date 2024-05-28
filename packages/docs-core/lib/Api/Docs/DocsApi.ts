import { Result } from '@standardnotes/domain-core'
import { CreateDocumentResponse } from '../Types/CreateDocumentResponse'
import { GetDocumentMetaResponse } from '../Types/GetDocumentMetaResponse'
import { Api } from '@proton/shared/lib/interfaces'
import {
  createDocument,
  createRealtimeValetToken,
  getDocumentMeta,
  getCommitData,
  createCommit,
  squashCommit,
  lockDocument,
} from '@proton/shared/lib/api/docs'
import { getApiError } from '@proton/shared/lib/api/helpers/apiErrorHelper'
import { CreateValetTokenResponse } from '../Types/CreateValetTokenResponse'
import { DocumentMetaInterface } from '@proton/docs-shared'
import { Commit, SquashCommit } from '@proton/docs-proto'
import { NodeMeta } from '@proton/drive-store'

export class DocsApi {
  constructor(private protonApi: Api) {}

  async getDocumentMeta(lookup: NodeMeta): Promise<Result<GetDocumentMetaResponse>> {
    if (!this.protonApi) {
      throw new Error('Proton API not set')
    }

    try {
      const response = await this.protonApi(getDocumentMeta(lookup.volumeId, lookup.linkId))
      return Result.ok(response)
    } catch (error) {
      const apiError = getApiError(error)
      return Result.fail(apiError.message)
    }
  }

  async getCommitData(lookup: NodeMeta, commitId: string): Promise<Result<Uint8Array>> {
    if (!this.protonApi) {
      throw new Error('Proton API not set')
    }

    try {
      const response: Response = await this.protonApi(getCommitData(lookup.volumeId, lookup.linkId, commitId))
      const buffer = await response.arrayBuffer()
      return Result.ok(new Uint8Array(buffer))
    } catch (error) {
      const apiError = getApiError(error)
      return Result.fail(apiError.message)
    }
  }

  async createCommit(docMeta: DocumentMetaInterface, commit: Commit): Promise<Result<Uint8Array>> {
    if (!this.protonApi) {
      throw new Error('Proton API not set')
    }

    try {
      const response = await this.protonApi(createCommit(docMeta.volumeId, docMeta.linkId, commit.serializeBinary()))
      return Result.ok(response)
    } catch (error) {
      const apiError = getApiError(error)
      return Result.fail(apiError.message)
    }
  }

  async lockDocument(docMeta: DocumentMetaInterface, fetchCommitId?: string): Promise<Result<Uint8Array>> {
    if (!this.protonApi) {
      throw new Error('Proton API not set')
    }

    try {
      const response = await this.protonApi(lockDocument(docMeta.volumeId, docMeta.linkId, fetchCommitId))
      const buffer = await response.arrayBuffer()
      return Result.ok(new Uint8Array(buffer))
    } catch (error) {
      const apiError = getApiError(error)
      return Result.fail(apiError.message)
    }
  }

  async squashCommit(
    docMeta: DocumentMetaInterface,
    commitId: string,
    squash: SquashCommit,
  ): Promise<Result<Uint8Array>> {
    if (!this.protonApi) {
      throw new Error('Proton API not set')
    }

    try {
      const response = await this.protonApi(
        squashCommit(docMeta.volumeId, docMeta.linkId, commitId, squash.serializeBinary()),
      )
      return Result.ok(response)
    } catch (error) {
      const apiError = getApiError(error)
      return Result.fail(apiError.message)
    }
  }

  async createDocument(lookup: NodeMeta): Promise<Result<CreateDocumentResponse>> {
    if (!this.protonApi) {
      throw new Error('Proton API not set')
    }

    try {
      const response = await this.protonApi(createDocument(lookup.volumeId, lookup.linkId))
      return Result.ok(response)
    } catch (error) {
      const apiError = getApiError(error)
      return Result.fail(apiError.message)
    }
  }

  async createRealtimeValetToken(lookup: NodeMeta, commitId?: string): Promise<Result<CreateValetTokenResponse>> {
    if (!this.protonApi) {
      throw new Error('Proton API not set')
    }

    try {
      const response = await this.protonApi(createRealtimeValetToken(lookup.volumeId, lookup.linkId, commitId))
      return Result.ok(response)
    } catch (error) {
      const apiError = getApiError(error)
      return Result.fail(apiError.message)
    }
  }
}
