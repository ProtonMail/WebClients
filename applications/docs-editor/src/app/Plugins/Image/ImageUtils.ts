import { $getEditor, $getSelection, $isNodeSelection } from 'lexical'
import type { ImageNode, SerializedImageNode } from './ImageNode'
import { $isImageNode } from './ImageNode'
import { CAN_USE_DOM } from '@lexical/utils'

export function $getImageNodeInSelection(): ImageNode | null {
  const selection = $getSelection()
  if (!$isNodeSelection(selection)) {
    return null
  }
  const nodes = selection.getNodes()
  const node = nodes[0]
  return $isImageNode(node) ? node : null
}

export function $canDropImage(event: DragEvent): boolean {
  const target = event.target
  const rootElement = $getEditor().getRootElement()
  return !!(
    target &&
    target instanceof HTMLElement &&
    !target.closest('code, span.Lexical__image') &&
    target.parentElement &&
    rootElement?.contains(target.parentElement)
  )
}

export function getDragImageData(event: DragEvent): null | SerializedImageNode {
  const dragData = event.dataTransfer?.getData('application/x-lexical-drag')
  if (!dragData) {
    return null
  }
  const { type, data } = JSON.parse(dragData)
  if (type !== 'image') {
    return null
  }
  return data
}

const getDOMSelection = (targetWindow: Window | null): Selection | null =>
  CAN_USE_DOM ? (targetWindow || window).getSelection() : null

export function getDragSelection(event: DragEvent): Range | null | undefined {
  let range
  const target = event.target as null | Element | Document
  let targetWindow: Document['defaultView'] | null = null
  if (target == null) {
    targetWindow = null
  } else if (target.nodeType === Node.DOCUMENT_NODE) {
    targetWindow = (target as Document).defaultView
  } else {
    targetWindow = (target as Element).ownerDocument.defaultView
  }
  const domSelection = getDOMSelection(targetWindow)
  if (document.caretRangeFromPoint) {
    range = document.caretRangeFromPoint(event.clientX, event.clientY)
  } else if (event.rangeParent && domSelection !== null) {
    domSelection.collapse(event.rangeParent, event.rangeOffset || 0)
    range = domSelection.getRangeAt(0)
  } else {
    throw Error(`Cannot get the selection when dragging`)
  }
  return range
}
