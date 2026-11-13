import downloadFile from '@proton/shared/lib/helpers/downloadFile'
import { CryptoProxy } from '@protontech/crypto'
import type { DebugArtifacts } from '@proton-docs/realtime-sdk'

import type { EditorInvoker } from './EditorInvoker'
import type { RecordedUpdate } from './UpdateRecorder'

// The debug menu's downloads, in /doc's file formats. They hold document content: build them only on a click, and
// never log them.

/**
 * Every update the recorder holds, named as /doc names them. Adapted from
 * `packages/docs-core/lib/AuthenticatedDocController/AuthenticatedDocController.ts`, its `getAllUpdatesAsZip`.
 */
export async function getAllUpdatesZip(updates: RecordedUpdate[]): Promise<Blob> {
  const zip = await createZip()
  for (const { timestamp, content } of updates) {
    zip.file(`${timestamp}-${await getSha1Hex(content)}.bin`, content)
  }
  return zip.generateAsync({ type: 'blob' })
}

/**
 * Adapted from `packages/docs-core/lib/EditorController/EditorController.ts`, its `getBaseCommitAsZip`. An update the
 * SDK could not read has no plaintext to give.
 */
export async function getBaseCommitZip(baseCommit: DebugArtifacts['baseCommit']): Promise<Blob> {
  const zip = await createZip()
  for (const { decrypted } of baseCommit.updates) {
    if (decrypted) {
      zip.file(`${decrypted.timestamp}.bin`, decrypted.content)
    }
  }
  return zip.generateAsync({ type: 'blob' })
}

type LogsSource = Pick<EditorInvoker, 'getYDocAsJSON' | 'getCurrentEditorState'>

/**
 * The document's logs, as /doc downloads them. Adapted from `applications/docs/src/app/utils/downloadLogs.ts`, its
 * `getLogsAsJSON` and `downloadLogsAsZip`, which take docs-core's editor controller.
 */
export async function downloadLogs(editorInvoker: LogsSource): Promise<void> {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
  downloadFile(await getLogsZip(editorInvoker, timestamp), `document-logs-${timestamp}.zip`)
}

export async function getLogsZip(editorInvoker: LogsSource, timestamp: string): Promise<Blob> {
  const zip = await createZip()
  zip.file(`ydoc-${timestamp}.json`, JSON.stringify(await editorInvoker.getYDocAsJSON(), null, 2))
  zip.file(`editor-${timestamp}.json`, JSON.stringify(await editorInvoker.getCurrentEditorState(), null, 2))
  return zip.generateAsync({ type: 'blob' })
}

async function createZip() {
  const JSZip = (await import('jszip')).default
  return new JSZip()
}

/** A file name, as docs-core `utils/hash.ts` (`getBufferHash`) gives it, so no security property hangs on SHA-1 */
async function getSha1Hex(data: Uint8Array<ArrayBuffer>) {
  return (await CryptoProxy.computeHash({ algorithm: 'unsafeSHA1', data })).toHex()
}
