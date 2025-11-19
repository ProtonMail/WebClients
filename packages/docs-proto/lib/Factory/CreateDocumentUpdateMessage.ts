import type { DocumentUpdate } from '../Generated'
import { ClientMessageWithDocumentUpdates } from '../Generated'
import { CreateDocumentUpdateArray } from './CreateDocumentUpdateArray'

export function CreateDocumentUpdateMessage(documentUpdate: DocumentUpdate) {
  const updates = CreateDocumentUpdateArray({ updates: [documentUpdate] })

  const message = new ClientMessageWithDocumentUpdates({
    updates: updates,
  })

  return message
}
