import type { AuthenticatedDocControllerInterface, EditorControllerInterface } from '@proton/docs-core'
import { isDevOrBlack } from '@proton/utils/env'
import { useEffect, useRef } from 'react'

const ARTIFACTS = {
  state_json: 'Current Yjs and spreadsheet state as JSON',
  spreadsheet_patches: 'Stored spreadsheet patches',
  spreadsheet_actions: 'Stored spreadsheet actions',
  yjs_state_update: 'Current Yjs state as one binary update',
  base_commit_updates: 'Base commit updates',
  all_updates: 'Base commit plus received and sent updates',
  update_timeline: 'Update metadata timeline as JSON',
  drift_log: 'Last Sheets Yjs drift detection details as JSON',
} as const

type Artifact = keyof typeof ARTIFACTS

function bytesToBase64(bytes: Uint8Array<ArrayBuffer>) {
  let binary = ''
  for (let offset = 0; offset < bytes.length; offset += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(offset, offset + 0x8000))
  }
  return btoa(binary)
}

function createToken() {
  return Array.from(crypto.getRandomValues(new Uint8Array(16)), (byte) => byte.toString(16).padStart(2, '0')).join('')
}

export function useSheetsDebugArtifacts(
  editorController: EditorControllerInterface | null,
  docController?: AuthenticatedDocControllerInterface,
  enabled = true,
  driftLogDetails: Record<string, unknown> | null = null,
) {
  const driftLogDetailsRef = useRef(driftLogDetails)
  driftLogDetailsRef.current = driftLogDetails

  useEffect(() => {
    if (!enabled || !editorController || !isDevOrBlack()) {
      return
    }

    const prepared = new Map<string, Blob>()
    const availableArtifacts = () =>
      (Object.entries(ARTIFACTS) as [Artifact, string][])
        .filter(([artifact]) => docController || !['all_updates', 'update_timeline'].includes(artifact))
        .filter(([artifact]) => artifact !== 'drift_log' || driftLogDetailsRef.current)
        .map(([artifact, description]) => ({ artifact, description }))

    const createArtifact = async (artifact: Artifact): Promise<{ filename: string; blob: Blob }> => {
      switch (artifact) {
        case 'state_json': {
          const [yDocJSON, spreadsheetState] = await Promise.all([
            editorController.getYDocAsJSON(),
            editorController.getLocalSpreadsheetStateJSON(),
          ])
          return {
            filename: 'sheet-debug-state.json',
            blob: new Blob([JSON.stringify({ yDocJSON, spreadsheetState }, null, 2)], { type: 'application/json' }),
          }
        }
        case 'spreadsheet_patches':
          return {
            filename: 'spreadsheet-patches.json',
            blob: await editorController.getSpreadsheetPatchesAsJsonFile(),
          }
        case 'spreadsheet_actions':
          return {
            filename: 'spreadsheet-actions.json',
            blob: await editorController.getSpreadsheetActionsAsJsonFile(),
          }
        case 'yjs_state_update': {
          const update = await editorController.getDocumentState()
          return {
            filename: 'yjs-state-as-update.bin',
            blob: new Blob([update], { type: 'application/octet-stream' }),
          }
        }
        case 'base_commit_updates':
          return { filename: 'base-commit-updates.zip', blob: await editorController.getBaseCommitAsZip() }
        case 'all_updates':
          if (!docController) {
            throw new Error('All updates are unavailable without an authenticated document controller')
          }
          return { filename: 'all-updates.zip', blob: await docController.getAllUpdatesAsZip() }
        case 'update_timeline': {
          if (!docController) {
            throw new Error('Update timeline is unavailable without an authenticated document controller')
          }
          const yDocJSON = await editorController.getYDocAsJSON()
          return {
            filename: 'update-timeline.json',
            blob: await docController.getUpdatesInformationAsJsonFile(yDocJSON),
          }
        }
        case 'drift_log':
          if (!driftLogDetailsRef.current) {
            throw new Error('No Sheets Yjs drift has been detected in this page lifecycle')
          }
          return {
            filename: 'sheets-yjs-drift-log.json',
            blob: new Blob([JSON.stringify(driftLogDetailsRef.current, null, 2)], { type: 'application/json' }),
          }
      }
    }

    const api = {
      async inspect() {
        return {
          clientId: String(await editorController.getDocumentClientId()),
          documentType: 'sheet',
          artifacts: availableArtifacts(),
        }
      },
      async prepare(artifact: Artifact) {
        if (!availableArtifacts().some((item) => item.artifact === artifact)) {
          throw new Error(`Debug artifact is unavailable: ${artifact}`)
        }
        const { filename, blob } = await createArtifact(artifact)
        const token = createToken()
        prepared.set(token, blob)
        return {
          token,
          artifact,
          filename,
          mimeType: blob.type || 'application/octet-stream',
          bytes: blob.size,
          archive: filename.endsWith('.zip') ? 'zip' : null,
        }
      },
      async read(token: string, offset: number, size: number) {
        const blob = prepared.get(token)
        if (!blob) {
          throw new Error('Prepared debug artifact is unavailable')
        }
        if (!Number.isSafeInteger(offset) || offset < 0) {
          throw new Error('Debug artifact offset must be a non-negative safe integer')
        }
        if (!Number.isSafeInteger(size) || size <= 0) {
          throw new Error('Debug artifact read size must be a positive safe integer')
        }
        const start = Math.min(offset, blob.size)
        const end = Math.min(blob.size, start + size)
        const bytes = new Uint8Array(await blob.slice(start, end).arrayBuffer())
        return { data: bytesToBase64(bytes), base64Encoded: true, nextOffset: end, eof: end >= blob.size }
      },
      discard(token: string) {
        return prepared.delete(token)
      },
    }

    ;(window as any).protonSheetsDebugArtifacts = api
    return () => {
      if ((window as any).protonSheetsDebugArtifacts === api) {
        delete (window as any).protonSheetsDebugArtifacts
      }
      prepared.clear()
    }
  }, [docController, editorController, enabled])
}
