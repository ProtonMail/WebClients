import type { EditorControllerInterface } from '@proton/docs-core'
import type { DocumentType } from '@proton/drive-store/store/_documents'

export interface LogsData {
  yDocJSON?: any
  sheetsJSON?: any
}

/**
 * Gets both Y.Doc and Sheets JSON logs from the editor controller
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

  return logs
}

/**
 * Downloads individual files without ZIP compression
 */
const downloadIndividualFiles = async (logsData: LogsData, documentType: DocumentType) => {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')

  // Download Y.Doc JSON
  if (logsData.yDocJSON) {
    const yDocStringified = JSON.stringify(logsData.yDocJSON, null, 2)
    const yDocBlob = new Blob([yDocStringified], { type: 'application/json' })
    const yDocUrl = URL.createObjectURL(yDocBlob)
    const yDocLink = document.createElement('a')
    yDocLink.href = yDocUrl
    yDocLink.download = `ydoc-${timestamp}.json`
    document.body.appendChild(yDocLink)
    yDocLink.click()
    document.body.removeChild(yDocLink)
    URL.revokeObjectURL(yDocUrl)
  }

  // Download Sheets JSON if available
  if (logsData.sheetsJSON) {
    const sheetsStringified = JSON.stringify(logsData.sheetsJSON, null, 2)
    const sheetsBlob = new Blob([sheetsStringified], { type: 'application/json' })
    const sheetsUrl = URL.createObjectURL(sheetsBlob)
    const sheetsLink = document.createElement('a')
    sheetsLink.href = sheetsUrl
    sheetsLink.download = `sheets-${timestamp}.json`
    document.body.appendChild(sheetsLink)
    sheetsLink.click()
    document.body.removeChild(sheetsLink)
    URL.revokeObjectURL(sheetsUrl)
  }
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

    // Add Y.Doc JSON to zip
    if (logsData.yDocJSON) {
      const yDocStringified = JSON.stringify(logsData.yDocJSON, null, 2)
      zip.file(`ydoc-${timestamp}.json`, yDocStringified)
    }

    // Add Sheets JSON to zip if available
    if (logsData.sheetsJSON) {
      const sheetsStringified = JSON.stringify(logsData.sheetsJSON, null, 2)
      zip.file(`sheets-${timestamp}.json`, sheetsStringified)
    }

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
