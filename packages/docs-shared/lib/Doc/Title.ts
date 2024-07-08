import { DecryptedNode } from '@proton/drive-store'
import { SupportedProtonDocsMimeTypes } from '@proton/shared/lib/drive/constants'

export const getNodeNameWithoutExtension = (node: DecryptedNode) => {
  let extension = 'txt'
  switch (node.mimeType) {
    case SupportedProtonDocsMimeTypes.md:
      extension = 'md'
      break
    case SupportedProtonDocsMimeTypes.docx:
      extension = 'docx'
      break
    case SupportedProtonDocsMimeTypes.html:
      extension = 'html'
      break
    default:
      extension = 'txt'
  }

  const nodeNameWithoutExtension = node.name.endsWith(`.${extension}`)
    ? node.name.substring(0, node.name.lastIndexOf(`.${extension}`))
    : node.name
  return nodeNameWithoutExtension
}
