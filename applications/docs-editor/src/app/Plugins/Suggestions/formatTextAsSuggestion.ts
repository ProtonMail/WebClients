import { $wrapNodeInElement } from '@lexical/utils'
import type { TextFormatType, TextNode } from 'lexical'
import { $createRangeSelection, $getSelection, $isRangeSelection, $isTextNode, $setSelection } from 'lexical'
import { GenerateUUID } from '@proton/docs-core'
import { $isSuggestionNode, $createSuggestionNode } from './ProtonNode'
import type { PropertyChangeSuggestionProperties } from './Types'
import { $unwrapSuggestionNodeAndResolveIfNeeded } from './removeSuggestionNodeAndResolveIfNeeded'
import type { Logger } from '@proton/utils/logs'

/**
 * Wraps the current selection in a "property-change" suggestion
 * and toggles the given format for it, while storing the existing
 * format so that it can be reversed on rejection.
 */
export function $formatTextAsSuggestion(
  format: TextFormatType,
  onSuggestionCreation: (id: string) => void,
  logger: Logger,
): boolean {
  logger.info('Formatting text as suggestion', format)

  const selection = $getSelection()
  if (!$isRangeSelection(selection)) {
    logger.info('Expected range selection')
    return true
  }

  if (selection.isCollapsed()) {
    logger.info('Directly setting selection format since it is collapsed')
    selection.formatText(format)
    return true
  }

  const suggestionID = GenerateUUID()
  const nodes = selection.extract()
  let anchorNode: TextNode | null = null
  let anchorOffset = 0
  let focusNode: TextNode | null = null
  let focusOffset = 0
  let didCreateSuggestionNode = false
  for (const node of nodes) {
    if (!$isTextNode(node)) {
      logger.info('Expected text node', node.__type)
      continue
    }

    const parent = node.getParent()
    if ($isSuggestionNode(parent)) {
      logger.info('Directly updating format as node is in suggestion')
      node.toggleFormat(format)

      const isFormatChangeSuggestion = parent.getSuggestionTypeOrThrow() === 'property-change'
      if (isFormatChangeSuggestion) {
        logger.info('Existing suggestion is format change suggestion')

        const suggestionInitialProperties = parent.__properties.nodePropertiesChanged as
          | PropertyChangeSuggestionProperties
          | undefined
        if (suggestionInitialProperties) {
          const latestFormat = node.getFormat()
          const formatSuggestionInitialFormat = suggestionInitialProperties.__format
          if (latestFormat === formatSuggestionInitialFormat) {
            logger.info('Unwrapping existing suggestion since format was reset to original')
            $unwrapSuggestionNodeAndResolveIfNeeded(parent)
          }
        }
      }
    } else {
      logger.info('Updating format and wrapping node in suggestion node')
      const initialNodeFormat = node.getFormat()
      node.toggleFormat(format)
      $wrapNodeInElement(node, () =>
        $createSuggestionNode(suggestionID, 'property-change', {
          __format: initialNodeFormat,
        } satisfies PropertyChangeSuggestionProperties),
      )
      didCreateSuggestionNode = true
    }

    if (!anchorNode) {
      anchorNode = node
    }
    focusNode = node
    focusOffset = node.getTextContentSize()
  }

  if (didCreateSuggestionNode) {
    onSuggestionCreation(suggestionID)
  }

  if (anchorNode && focusNode) {
    logger.info('Fixing selection')
    const newSelection = $createRangeSelection()
    newSelection.setTextNodeRange(anchorNode, anchorOffset, focusNode, focusOffset)
    $setSelection(newSelection)
  }

  return true
}
