import { DocumentUpdate } from '../Generated'
import { DocumentUpdateVersion } from '../Version'

export function CreateDocumentUpdate(dto: {
  content: Uint8Array
  authorId: string
  timestamp: number
  version: DocumentUpdateVersion
}): DocumentUpdate {
  const documentUpdate = new DocumentUpdate({
    authorId: dto.authorId,
    encryptedContent: dto.content,
    timestamp: dto.timestamp,
    version: dto.version,
  })

  return documentUpdate
}
