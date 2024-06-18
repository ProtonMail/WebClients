import { DocumentUpdate } from '../Generated'
import { DocumentUpdateVersion } from '../Version'

export function CreateDocumentUpdate(dto: {
  content: Uint8Array
  authorAddress: string
  timestamp: number
  version: DocumentUpdateVersion
  uuid: string
}): DocumentUpdate {
  const documentUpdate = new DocumentUpdate({
    authorAddress: dto.authorAddress,
    encryptedContent: dto.content,
    timestamp: dto.timestamp,
    version: dto.version,
    uuid: dto.uuid,
  })

  return documentUpdate
}
