import type { ElementNode } from 'lexical'
import type { Style } from '@react-pdf/types'

export const getNodeTextAlignment = (node: ElementNode): Style['textAlign'] => {
  const formatType = node.getFormatType()

  if (!formatType) {
    return 'left'
  }

  if (formatType === 'start') {
    return 'left'
  }

  if (formatType === 'end' || formatType === 'right') {
    return 'right'
  }

  return formatType
}
