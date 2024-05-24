import { ClientMessageWithDocumentUpdates } from '../Generated'
import { DocumentUpdateVersion } from '../Version'
import { CreateDocumentUpdate } from './CreateDocumentUpdate'
import { CreateDocumentUpdateArray } from './CreateDocumentUpdateArray'

export function CreateDocumentUpdateMessage(dto: {
  content: Uint8Array
  authorId: string
  timestamp: number
  version: DocumentUpdateVersion
}): ClientMessageWithDocumentUpdates {
  const documentUpdate = CreateDocumentUpdate({
    content: dto.content,
    authorId: dto.authorId,
    timestamp: dto.timestamp,
    version: dto.version,
  })

  const updates = CreateDocumentUpdateArray({ updates: [documentUpdate] })

  const message = new ClientMessageWithDocumentUpdates({
    updates: updates,
  })

  return message
}
