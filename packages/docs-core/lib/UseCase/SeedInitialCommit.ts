import { CommitVersion, DocumentUpdateVersion, CreateDocumentUpdate, CreateCommit } from '@proton/docs-proto'
import type { UseCaseInterface } from '../Domain/UseCase/UseCaseInterface'
import { Result } from '../Domain/Result/Result'
import type { DocsApi } from '../Api/DocsApi'
import type { EncryptMessage } from './EncryptMessage'
import type { DocumentKeys } from '@proton/drive-store'
import type { DocumentMetaInterface } from '@proton/docs-shared'
import { GenerateUUID } from '../Util/GenerateUuid'

type SeedInitialCommitResult = { commitId: string; linkId: string; volumeId: string }

/**
 * Allows the client to create an initial commit. This used by the Duplicate function to allow us to seed the document
 * with an initial commit value equaling the source document's.
 */
export class SeedInitialCommit implements UseCaseInterface<SeedInitialCommitResult> {
  constructor(
    private docsApi: DocsApi,
    private encryptMessage: EncryptMessage,
  ) {}

  async execute(
    docMeta: DocumentMetaInterface['nodeMeta'],
    state: Uint8Array,
    keys: DocumentKeys,
  ): Promise<Result<SeedInitialCommitResult>> {
    const metadata = {
      version: DocumentUpdateVersion.V1,
      authorAddress: keys.userOwnAddress,
      timestamp: Date.now(),
    }
    const encryptedUpdate = await this.encryptMessage.execute(state, metadata, keys)
    if (encryptedUpdate.isFailed()) {
      return Result.fail<SeedInitialCommitResult>(encryptedUpdate.getError())
    }

    const update = CreateDocumentUpdate({
      content: encryptedUpdate.getValue(),
      authorAddress: metadata.authorAddress,
      timestamp: metadata.timestamp,
      version: metadata.version,
      uuid: GenerateUUID(),
    })

    const commit = CreateCommit({
      updates: [update],
      version: CommitVersion.V1,
      lockId: '',
    })

    const commitResult = await this.docsApi.seedInitialCommit(docMeta, commit)

    if (commitResult.isFailed()) {
      return Result.fail(commitResult.getError())
    }

    const { CommitID: commitId, VolumeID: volumeId, LinkID: linkId } = commitResult.getValue()

    return Result.ok<SeedInitialCommitResult>({ commitId, volumeId, linkId })
  }
}
