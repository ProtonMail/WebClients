import { Commit, DocumentUpdate } from '../Generated'
import { CommitVersion } from '../Version'
import { CreateDocumentUpdateArray } from './CreateDocumentUpdateArray'

export function CreateCommit(dto: { updates: DocumentUpdate[]; version: CommitVersion; lockId: string }): Commit {
  const updatesArray = CreateDocumentUpdateArray({
    updates: dto.updates,
  })

  const commit = new Commit({
    updates: updatesArray,
    version: dto.version,
    lockId: dto.lockId,
  })

  return commit
}
