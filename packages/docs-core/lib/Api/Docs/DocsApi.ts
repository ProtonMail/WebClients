import { CreateDocumentResponse } from '../Types/CreateDocumentResponse'
import { GetDocumentMetaResponse } from '../Types/GetDocumentMetaResponse'
import { Api } from '@proton/shared/lib/interfaces'
import {
  createDocument,
  createRealtimeValetToken,
  getDocumentMeta,
  getCommitData,
  seedInitialCommit,
  squashCommit,
  lockDocument,
} from '@proton/shared/lib/api/docs'
import { CreateValetTokenResponse } from '../Types/CreateValetTokenResponse'
import { DocumentMetaInterface } from '@proton/docs-shared'
import { Commit, SquashCommit } from '@proton/docs-proto'
import { NodeMeta } from '@proton/drive-store'
import { getErrorString } from '../../Util/GetErrorString'
import { Result } from '../../Domain/Result/Result'

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
      return Result.fail(getErrorString(error) ?? 'Unknown error')
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
      return Result.fail(getErrorString(error) ?? 'Unknown error')
    }
  }

  async seedInitialCommit(docMeta: DocumentMetaInterface, commit: Commit): Promise<Result<Uint8Array>> {
    if (!this.protonApi) {
      throw new Error('Proton API not set')
    }

    try {
      const response = await this.protonApi(seedInitialCommit(docMeta.volumeId, docMeta.linkId, commit.serializeBinary()))
      return Result.ok(response)
    } catch (error) {
      return Result.fail(getErrorString(error) ?? 'Unknown error')
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
      return Result.fail(getErrorString(error) ?? 'Unknown error')
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
      return Result.fail(getErrorString(error) ?? 'Unknown error')
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
      return Result.fail(getErrorString(error) ?? 'Unknown error')
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
      return Result.fail(getErrorString(error) ?? 'Unknown error')
    }
  }
}
