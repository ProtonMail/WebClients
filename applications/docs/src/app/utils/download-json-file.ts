/**
 * Helper function to download a single JSON file
 */
export function downloadJSONFile(data: any, filename: string) {
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
