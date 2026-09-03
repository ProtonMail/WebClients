export const getSheetNameFromFilename = (filename = '') => {
  const extensionIndex = filename.lastIndexOf('.')
  const name = extensionIndex === -1 ? filename : filename.slice(0, extensionIndex)

  return name.trim() ? name : undefined
}
