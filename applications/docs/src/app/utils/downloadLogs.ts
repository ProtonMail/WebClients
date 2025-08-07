import type { EditorControllerInterface } from '@proton/docs-core'
import type { DocumentType } from '@proton/drive-store/store/_documents'

export interface LogsData {
  yDocJSON?: any
  sheetsJSON?: any
  editorJSON?: any
}

/**
 * Gets Y.Doc, Sheets JSON, and Editor JSON logs from the editor controller
 */
export const getLogsAsJSON = async (
  editorController: EditorControllerInterface,
  documentType: DocumentType,
): Promise<LogsData> => {
  const logs: LogsData = {}

  // Get Y.Doc JSON
  const yDocJSON = await editorController.getYDocAsJSON()
  if (yDocJSON) {
    logs.yDocJSON = yDocJSON
  }

  // Get latest spreadsheet state to log JSON if it's a spreadsheet document
  if (documentType === 'sheet') {
    const sheetsJSON = await editorController.getLatestSpreadsheetStateToLogJSON()
    if (sheetsJSON) {
      logs.sheetsJSON = sheetsJSON
    }
  }

  // Get editor JSON if it's a document (not spreadsheet)
  if (documentType === 'doc') {
    const editorJSON = await editorController.getEditorJSON()
    if (editorJSON) {
      logs.editorJSON = editorJSON
    }
  }

  return logs
}

/**
 * Helper function to download a single JSON file
 */
const downloadJSONFile = (data: any, filename: string) => {
  const stringified = JSON.stringify(data, null, 2)
  const blob = new Blob([stringified], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

/**
 * Helper function to get file definitions from logs data
 */
const getFileDefinitions = (logsData: LogsData) => [
  { data: logsData.yDocJSON, prefix: 'ydoc' },
  { data: logsData.sheetsJSON, prefix: 'sheets' },
  { data: logsData.editorJSON, prefix: 'editor' },
]

/**
 * Downloads individual files without ZIP compression
 */
const downloadIndividualFiles = async (logsData: LogsData, documentType: DocumentType) => {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
  const files = getFileDefinitions(logsData)

  files.forEach(({ data, prefix }) => {
    if (data) {
      downloadJSONFile(data, `${prefix}-${timestamp}.json`)
    }
  })
}

/**
 * Downloads the provided logs data as a ZIP file using dynamically imported JSZip
 */
export const downloadLogsAsZip = async (logsData: LogsData, documentType: DocumentType) => {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
  const typeLabel = documentType === 'sheet' ? 'sheet' : 'document'

  try {
    // Dynamically import JSZip on demand
    const JSZip = (await import('jszip')).default
    const zip = new JSZip()

    // Add all available JSON files to zip
    const files = getFileDefinitions(logsData)
    files.forEach(({ data, prefix }) => {
      if (data) {
        const stringified = JSON.stringify(data, null, 2)
        zip.file(`${prefix}-${timestamp}.json`, stringified)
      }
    })

    // Generate and download the zip file
    const zipBlob = await zip.generateAsync({ type: 'blob' })
    const zipUrl = URL.createObjectURL(zipBlob)
    const zipLink = document.createElement('a')
    zipLink.href = zipUrl
    zipLink.download = `${typeLabel}-logs-${timestamp}.zip`
    document.body.appendChild(zipLink)
    zipLink.click()
    document.body.removeChild(zipLink)
    URL.revokeObjectURL(zipUrl)
  } catch (error) {
    console.warn('Failed to load JSZip or create ZIP file, falling back to individual downloads:', error)
    // Fallback to individual file downloads
    await downloadIndividualFiles(logsData, documentType)
  }
}

/**
 * Main function that combines getting logs and downloading them as a ZIP file
 */
export const downloadLogsAsJSON = async (editorController: EditorControllerInterface, documentType: DocumentType) => {
  const logsData = await getLogsAsJSON(editorController, documentType)
  await downloadLogsAsZip(logsData, documentType)
}
