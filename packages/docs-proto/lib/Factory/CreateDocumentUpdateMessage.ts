import { ClientMessageWithDocumentUpdates } from '../Generated'
import type { DocumentUpdateVersion } from '../Version'
import { CreateDocumentUpdate } from './CreateDocumentUpdate'
import { CreateDocumentUpdateArray } from './CreateDocumentUpdateArray'

export function CreateDocumentUpdateMessage(dto: {
  content: Uint8Array<ArrayBuffer>
  authorAddress: string | undefined
  timestamp: number
  version: DocumentUpdateVersion
  uuid: string
}): ClientMessageWithDocumentUpdates {
  const documentUpdate = CreateDocumentUpdate({
    content: dto.content,
    authorAddress: dto.authorAddress,
    timestamp: dto.timestamp,
    version: dto.version,
    uuid: dto.uuid,
  })

  const updates = CreateDocumentUpdateArray({ updates: [documentUpdate] })

  const message = new ClientMessageWithDocumentUpdates({
    updates: updates,
  })

  return message
}
