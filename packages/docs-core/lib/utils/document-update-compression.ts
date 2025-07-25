import type { DocumentType } from '@proton/drive-store/store/_documents'
import type { UnleashClient } from '@proton/unleash'
import { gzipSync, decompressSync } from 'fflate'

export function isCompressedDocumentUpdate(data: Uint8Array): boolean {
  // Check if the first two bytes match the gzip magic number
  return data.length >= 2 && data[0] === 0x1f && data[1] === 0x8b
}

export function compressDocumentUpdate(data: Uint8Array): Uint8Array {
  return gzipSync(data)
}

export function decompressDocumentUpdate(data: Uint8Array): Uint8Array {
  return decompressSync(data)
}

export function isDocumentUpdateCompressionEnabled(unleashClient: UnleashClient, documentType: DocumentType): boolean {
  return (
    unleashClient.isReady() &&
    unleashClient.isEnabled(
      documentType === 'sheet' ? 'SheetsUpdateCompressionEnabled' : 'DocsUpdateCompressionEnabled',
    )
  )
}
