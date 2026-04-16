import { decodeUpdate, Item } from 'yjs'
import { decompressDocumentUpdate, isCompressedDocumentUpdate } from './document-update-compression'
import { getBufferHash } from './hash'

export type UpdateTimelineEntry = {
  timestamp: number
  authorAddress: string
  size: number
  structCount: number
  structClientIds: number[]
  structTypes: string[]
  deleteSet: Record<number, number>
}

type Update = {
  timestamp: number
  authorAddress: string
  content: Uint8Array<ArrayBuffer>
}

export async function createUpdateTimelineEntry(update: Update): Promise<UpdateTimelineEntry> {
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
  const affectParents = new Set<string>()
  let structCount = 0
  for (const struct of decoded.structs) {
    structClientIds.add(struct.id.client)
    structTypes.add(struct.constructor.name)
    if (struct instanceof Item) {
      if (struct.parentSub) {
        affectParents.add(struct.parentSub)
      }
      if (typeof struct.parent === 'string') {
        affectParents.add(struct.parent)
      }
    }
    structCount++
  }
  const deleteCountsPerClientId: Record<number, number> = {}
  for (const [clientId, items] of decoded.ds.clients) {
    deleteCountsPerClientId[clientId] = items.length
  }
  const hash = await getBufferHash(content)
  return {
    structCount,
    structClientIds: Array.from(structClientIds),
    structTypes: Array.from(structTypes),
    deleteSet: deleteCountsPerClientId,
    hash,
    affectedParents: Array.from(affectParents),
  }
}

export async function downloadUpdateTimeline(updates: Update[], ydoc?: any) {
  const entries: UpdateTimelineEntry[] = []
  for (const update of updates) {
    const entry = await createUpdateTimelineEntry(update)
    entries.push(entry)
  }
  const json: {
    entries: UpdateTimelineEntry[]
    spreadsheetInfo?: {
      sheetIds: number[]
      sheetDataKeys: string[]
      sharedStringsLength: number
      numberOfNullInSharedStrings: number
    }
  } = {
    entries,
  }
  if (typeof ydoc === 'object' && ydoc !== null) {
    if ('sheets' in ydoc || 'sheetData' in ydoc || 'sharedStrings' in ydoc) {
      json.spreadsheetInfo = {
        sheetIds: ydoc.sheets ? ydoc.sheets.map((sheet: any) => sheet.sheetId) : [],
        sheetDataKeys: ydoc.sheetData ? Object.keys(ydoc.sheetData) : [],
        sharedStringsLength: ydoc.sharedStrings ? ydoc.sharedStrings.length : 0,
        numberOfNullInSharedStrings: ydoc.sharedStrings ? ydoc.sharedStrings.filter((s: any) => s === null).length : 0,
      }
    }
  }
  const stringified = JSON.stringify(json, null, 2)
  const blob = new Blob([stringified], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = 'update-timeline.json'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
