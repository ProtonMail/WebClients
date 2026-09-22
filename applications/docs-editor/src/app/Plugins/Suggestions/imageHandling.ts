import { $findMatchingParent, $wrapNodeInElement } from '@lexical/utils'
import { GenerateUUID } from '@proton/docs-shared'
import type { Logger } from '@proton/shared/lib/logs'
import { $createRangeSelection, $getNodeByKey, $setSelection } from 'lexical'
import { $createImageNode } from '../Image/ImageNode'
import type { SetImageSizePayload } from '../Image/ImagePlugin'
import { $canDropImage, $getImageNodeInSelection, getDragImageData, getDragSelection } from '../Image/ImageUtils'
import { $isImageNode } from '../Image/isImageNode'
import { $createSuggestionNode, $isSuggestionNode } from './ProtonNode'

export function $handleImageSizeChangeAsSuggestion(
  payload: SetImageSizePayload,
  onSuggestionCreation: (id: string) => void,
  logger: Logger,
): boolean {
  const { nodeKey, width, height } = payload
  logger.info('Handling image size change', payload)
  const node = $getNodeByKey(nodeKey)
  if (!$isImageNode(node)) {
    logger.info('Node is not image node')
    return true
  }
  const initialWidth = node.getWidth()
  const initialHeight = node.getHeight()
  logger.info('Setting new width and height')
  node.setWidthAndHeight(width, height)
  const existingSuggestionParent = $findMatchingParent(node, $isSuggestionNode)
  const suggestionType = existingSuggestionParent?.getSuggestionTypeOrThrow()
  if (existingSuggestionParent || suggestionType === 'insert' || suggestionType === 'image-change') {
    return true
  }
  logger.info('Wrapping node with new suggestion', initialWidth, initialHeight)
  const suggestionID = GenerateUUID()
  $wrapNodeInElement(node, () =>
    $createSuggestionNode(suggestionID, 'image-change', {
      width: initialWidth,
      height: initialHeight,
    }),
  )
  onSuggestionCreation(suggestionID)
  return true
}

export function $handleImageDragAndDropAsSuggestion(
  event: DragEvent,
  onSuggestionCreation: (id: string) => void,
  logger: Logger,
) {
  const draggedImageNode = $getImageNodeInSelection()
  if (!draggedImageNode) {
    logger.info('No dragged image node')
    return false
  }
  const data = getDragImageData(event)
  if (!data) {
    logger.info('Could not get image data from event')
    return true
  }
  event.preventDefault()
  if (!$canDropImage(event)) {
    logger.info('Cannot drop image')
    return true
  }
  const suggestionID = GenerateUUID()
  const range = getDragSelection(event)
  logger.info('Wrapping existing node with "delete" type')
  $wrapNodeInElement(draggedImageNode, () => $createSuggestionNode(suggestionID, 'delete'))
  const rangeSelection = $createRangeSelection()
  if (range !== null && range !== undefined) {
    rangeSelection.applyDOMRange(range)
  }
  $setSelection(rangeSelection)
  const imageNode = $createImageNode({
    altText: data.altText,
    height: data.height,
    maxWidth: data.maxWidth,
    width: data.width,
    src: data.src,
  })
  logger.info('Created and inserted "insert" type suggestion')
  const insertSuggestion = $createSuggestionNode(suggestionID, 'insert').append(imageNode)
  rangeSelection.insertNodes([insertSuggestion])
  onSuggestionCreation(suggestionID)
  return true
}
