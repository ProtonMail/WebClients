import type { DocumentUpdate } from '../Generated'
import { DocumentUpdateArray } from '../Generated'

export function CreateDocumentUpdateArray(dto: { updates: DocumentUpdate[] }): DocumentUpdateArray {
  const documentUpdateArray = new DocumentUpdateArray({
    documentUpdates: dto.updates,
  })

  return documentUpdateArray
}
