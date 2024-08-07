import type { ElementNode } from 'lexical'

export const getNodeTextAlignment = (node: ElementNode) => {
  const formatType = node.getFormatType()

  if (!formatType) {
    return 'left'
  }

  if (formatType === 'start') {
    return 'left'
  }

  if (formatType === 'end') {
    return 'right'
  }

  return formatType
}
