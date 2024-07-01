import { CommitVersion, DocumentUpdateVersion, CreateDocumentUpdate, CreateCommit } from '@proton/docs-proto'
import { UseCaseInterface } from '../Domain/UseCase/UseCaseInterface'
import { Result } from '../Domain/Result/Result'
import { DocsApi } from '../Api/DocsApi'
import { EncryptMessage } from './EncryptMessage'
import { DocumentKeys } from '@proton/drive-store'
import { DocumentMetaInterface } from '@proton/docs-shared'
import { GenerateUUID } from '../Util/GenerateUuid'

/**
 * Allows the client to create an initial commit. This used by the Duplicate function to allow us to seed the document
 * with an initial commit value equaling the source document's.
 */
export class SeedInitialCommit implements UseCaseInterface<boolean> {
  constructor(
    private docsApi: DocsApi,
    private encryptMessage: EncryptMessage,
  ) {}

  async execute(docMeta: DocumentMetaInterface, state: Uint8Array, keys: DocumentKeys): Promise<Result<boolean>> {
    const metadata = {
      version: DocumentUpdateVersion.V1,
      authorAddress: keys.userOwnAddress,
      timestamp: Date.now(),
    }
    const encryptedUpdate = await this.encryptMessage.execute(state, metadata, keys)
    if (encryptedUpdate.isFailed()) {
      return Result.fail(encryptedUpdate.getError())
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

    return Result.ok(true)
  }
}
