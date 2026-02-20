import { MAX_UPDATE_SIZE, UPDATE_CHUNK_SAFE_SIZE_MARGIN } from '../Models/Constants'
import type { UnleashClient } from '@proton/unleash'
import { DocumentUpdate } from '@proton/docs-proto'
import type { DocumentType } from '@proton/drive-store/store/_documents'

const HEADER_SIGNAL = new TextEncoder().encode('update-chunk-header')
const HEADER_VERSION = 0
const HEADER_VERSION_LENGTH = 1
const HEADER_ID_LENGTH = 1
const HEADER_TOTAL_CHUNKS_LENGTH = 1
const HEADER_INDEX_LENGTH = 1

const HEADER_BYTES_LENGTH =
  HEADER_SIGNAL.byteLength + HEADER_VERSION_LENGTH + HEADER_ID_LENGTH + HEADER_TOTAL_CHUNKS_LENGTH + HEADER_INDEX_LENGTH

export const MAX_CHUNK_CONTENT_SIZE = MAX_UPDATE_SIZE - HEADER_BYTES_LENGTH - UPDATE_CHUNK_SAFE_SIZE_MARGIN

export function isDocumentUpdateChunk(data: Uint8Array<ArrayBuffer>): boolean {
  return (
    data.length >= HEADER_BYTES_LENGTH &&
    data.slice(0, HEADER_SIGNAL.length).every((value, index) => value === HEADER_SIGNAL[index])
  )
}

export type DocumentUpdateChunk = {
  version: number
  id: number
  total: number
  index: number
  content: Uint8Array<ArrayBuffer>
}

export function serializeDocumentUpdateChunk({
  id,
  total,
  index,
  content,
}: Omit<DocumentUpdateChunk, 'version'>): Uint8Array<ArrayBuffer> {
  const serializedChunk = new Uint8Array(HEADER_BYTES_LENGTH + content.length)
  serializedChunk.set(HEADER_SIGNAL, 0)
  const dataView = new DataView(serializedChunk.buffer)

  let offset = HEADER_SIGNAL.length
  // version
  dataView.setUint8(offset, HEADER_VERSION)
  offset += HEADER_VERSION_LENGTH
  // id
  dataView.setUint8(offset, id)
  offset += HEADER_ID_LENGTH
  // total
  dataView.setUint8(offset, total)
  offset += HEADER_TOTAL_CHUNKS_LENGTH
  // index
  dataView.setUint8(offset, index)

  // content
  serializedChunk.set(content, HEADER_BYTES_LENGTH)

  return serializedChunk
}

export function deserializeDocumentUpdateChunk(data: Uint8Array<ArrayBuffer>): DocumentUpdateChunk {
  const dataView = new DataView(data.buffer, data.byteOffset, data.byteLength)

  let offset = HEADER_SIGNAL.length
  // version
  const version = dataView.getUint8(offset)
  offset += HEADER_VERSION_LENGTH
  // id
  const id = dataView.getUint8(offset)
  offset += HEADER_ID_LENGTH
  // total
  const total = dataView.getUint8(offset)
  offset += HEADER_TOTAL_CHUNKS_LENGTH
  // index
  const index = dataView.getUint8(offset)

  // content
  const content = data.slice(HEADER_BYTES_LENGTH)

  return { content, total, index, version, id }
}

export function canDocumentUpdateBeSplit(
  documentUpdate: Uint8Array<ArrayBuffer>,
  options: {
    maxChunkSize: number
    maxChunks: number
  },
): boolean {
  const { maxChunkSize, maxChunks } = options

  const totalChunks = Math.ceil(documentUpdate.byteLength / maxChunkSize)
  return totalChunks <= maxChunks
}

export function splitDocumentUpdateIntoChunks(
  documentUpdate: Uint8Array<ArrayBuffer>,
  {
    maxChunkSize,
  }: {
    maxChunkSize: number
  },
): Uint8Array<ArrayBuffer>[] {
  const id = crypto.getRandomValues(new Uint8Array(HEADER_ID_LENGTH))[0]

  const chunks: Uint8Array<ArrayBuffer>[] = []
  const total = Math.ceil(documentUpdate.byteLength / maxChunkSize)

  for (let index = 0; index < total; index++) {
    const start = index * maxChunkSize
    const end = start + maxChunkSize
    const content = documentUpdate.slice(start, end)
    const serializedChunk = serializeDocumentUpdateChunk({ id, total, index, content })
    chunks.push(serializedChunk)
  }

  return chunks
}

export type DocumentUpdateChunkStateEntry = {
  total: number
  received: number
  chunks: Map<number, Uint8Array<ArrayBuffer>>
}
export type DocumentUpdateChunkState = Map<number, DocumentUpdateChunkStateEntry>

export function createDocumentUpdateChunkState(): DocumentUpdateChunkState {
  return new Map()
}

type ProcessDocumentUpdateChunkOptions = {
  state: DocumentUpdateChunkState
  onDocumentUpdateResolved: (value: { documentUpdate: Uint8Array<ArrayBuffer> }) => Promise<void>
}

export async function processDocumentUpdateChunk(
  serializedChunk: Uint8Array<ArrayBuffer>,
  { state, onDocumentUpdateResolved }: ProcessDocumentUpdateChunkOptions,
) {
  const { version, id, total, index, content } = deserializeDocumentUpdateChunk(serializedChunk)
  if (version !== HEADER_VERSION) {
    throw new Error('Update chunk version does not match expected version')
  }

  const entry: DocumentUpdateChunkStateEntry = state.get(id) ?? {
    total,
    received: 0,
    chunks: new Map(),
  }
  state.set(id, entry)

  if (entry.chunks.has(index)) {
    // If we already got this chunk, check if it matches the expected content. If it does, we can just skip processing, otherwise we throw an error for visibility.
    const existingChunk = entry.chunks.get(index)
    if (existingChunk && !isEqualArray(existingChunk, content)) {
      throw new Error(`Chunk ${index} already exists but does not match expected content`)
    }
    return
  }

  entry.received++
  entry.chunks.set(index, content)

  if (entry.received === entry.total) {
    let totalByteSize = 0
    for (const chunk of entry.chunks.values()) {
      totalByteSize += chunk.byteLength
    }

    const documentUpdate = new Uint8Array(totalByteSize)
    let offset = 0
    for (let i = 0; i < entry.total; i++) {
      const chunk = entry.chunks.get(i)
      if (!chunk) {
        throw new Error(`Could not find chunk with index ${i} for id ${id}`)
      }
      documentUpdate.set(chunk, offset)
      offset += chunk.byteLength
    }

    await onDocumentUpdateResolved({ documentUpdate })

    state.delete(id)
  } else if (entry.received > entry.total) {
    throw new Error(
      `Received more chunks than expected for id ${id}. Expected ${entry.total}, received ${entry.received}`,
    )
  }
}

export async function processMultipleDocumentUpdates(documentUpdates: DocumentUpdate[]): Promise<DocumentUpdate[]> {
  const documentUpdateChunkState = createDocumentUpdateChunkState()
  const updates: DocumentUpdate[] = []

  for (const update of documentUpdates) {
    const content = update.encryptedContent as Uint8Array<ArrayBuffer>
    if (isDocumentUpdateChunk(content)) {
      await processDocumentUpdateChunk(content, {
        state: documentUpdateChunkState,
        onDocumentUpdateResolved: async ({ documentUpdate: updateContent }) => {
          const documentUpdate = new DocumentUpdate({
            encryptedContent: updateContent,
            version: update.version,
            timestamp: update.timestamp,
            authorAddress: update.authorAddress,
            uuid: update.uuid,
          })
          updates.push(documentUpdate)
        },
      })
    } else {
      updates.push(update)
    }
  }

  return updates
}

export function isDocumentUpdateChunkingEnabled(unleashClient: UnleashClient, documentType: DocumentType): boolean {
  return (
    unleashClient.isReady() &&
    unleashClient.isEnabled(documentType === 'sheet' ? 'SheetsUpdateChunkingEnabled' : 'DocsUpdateChunkingEnabled')
  )
}

function isEqualArray(a: Uint8Array<ArrayBuffer>, b: Uint8Array<ArrayBuffer>): boolean {
  if (a.length != b.length) {
    return false
  }
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) {
      return false
    }
  }
  return true
}
