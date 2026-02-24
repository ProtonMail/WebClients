import { decodeUpdate } from 'yjs'
import { decompressDocumentUpdate, isCompressedDocumentUpdate } from './document-update-compression'

export type UpdateTimelineEntry = {
  timestamp: number
  authorAddress: string
  size: number
  structCount: number
  structClientIds: number[]
  structTypes: string[]
  deleteSet: Record<number, number>
}

export async function createUpdateTimelineEntry(update: {
  timestamp: number
  authorAddress: string
  content: Uint8Array<ArrayBuffer>
}): Promise<UpdateTimelineEntry> {
  let content = update.content
  if (isCompressedDocumentUpdate(content)) {
    content = decompressDocumentUpdate(content)
  }
  const info = await getUpdateInfo(content)
  return {
    timestamp: update.timestamp,
    authorAddress: update.authorAddress,
    size: content.byteLength,
    ...info,
  }
}

async function getUpdateInfo(content: Uint8Array<ArrayBuffer>) {
  const decoded = decodeUpdate(content)
  const structClientIds = new Set<number>()
  const structTypes = new Set<string>()
  let structCount = 0
  for (const struct of decoded.structs) {
    structClientIds.add(struct.id.client)
    structTypes.add(struct.constructor.name)
    structCount++
  }
  const deleteCountsPerClientId: Record<number, number> = {}
  for (const [clientId, items] of decoded.ds.clients) {
    deleteCountsPerClientId[clientId] = items.length
  }
  const hash = await getUpdateHash(content)
  return {
    structCount,
    structClientIds: Array.from(structClientIds),
    structTypes: Array.from(structTypes),
    deleteSet: deleteCountsPerClientId,
    hash,
  }
}

export async function getUpdateHash(content: Uint8Array<ArrayBuffer>) {
  const hash = await window.crypto.subtle.digest('SHA-1', content)
  const hashHex = Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
  return hashHex
}
