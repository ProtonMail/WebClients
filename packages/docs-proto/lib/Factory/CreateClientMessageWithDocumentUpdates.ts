import type { DocumentUpdate } from '../Generated'
import { ClientMessageWithDocumentUpdates } from '../Generated'
import { CreateDocumentUpdateArray } from './CreateDocumentUpdateArray'

export function CreateClientMessageWithDocumentUpdates(dto: {
  updates: DocumentUpdate[]
}): ClientMessageWithDocumentUpdates {
  const updates = CreateDocumentUpdateArray({ updates: dto.updates })

  const message = new ClientMessageWithDocumentUpdates({
    updates: updates,
  })

  return message
}
