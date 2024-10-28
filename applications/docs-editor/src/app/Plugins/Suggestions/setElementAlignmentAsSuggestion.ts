import { $findMatchingParent, $insertFirst } from '@lexical/utils'
import type { ElementNode } from 'lexical'
import { $getSelection, $isElementNode, $isRangeSelection, type ElementFormatType } from 'lexical'
import type { ProtonNode } from './ProtonNode'
import { $createSuggestionNode, $isSuggestionNode } from './ProtonNode'
import { GenerateUUID } from '@proton/docs-core'
import { $removeSuggestionNodeAndResolveIfNeeded } from './removeSuggestionNodeAndResolveIfNeeded'
import type { Logger } from '@proton/utils/logs'
import { $isListNode } from '@lexical/list'

export function $setElementAlignmentAsSuggestion(
  formatType: ElementFormatType,
  onSuggestionCreation: (id: string) => void,
  logger: Logger,
): boolean {
  logger.info('Setting element alignment', formatType)

  const selection = $getSelection()
  if (!$isRangeSelection(selection)) {
    logger.info('Selection is not range selection')
    return true
  }

  const nodes = selection.getNodes()
  const alreadyHandled = new Set()

  const suggestionID = GenerateUUID()
  let didCreateSuggestion = false

  for (const node of nodes) {
    const key = node.getKey()
    if (alreadyHandled.has(key)) {
      logger.info('Already handled node', key)
      continue
    }

    const isShadowRoot = $isElementNode(node) && node.isShadowRoot()
    if ($isListNode(node) || isShadowRoot) {
      continue
    }

    const element = $findMatchingParent(
      node,
      (parentNode): parentNode is ElementNode => $isElementNode(parentNode) && !parentNode.isInline(),
    )
    if (!element) {
      logger.info('Could not find non-inline element parent')
      continue
    }

    const elementKey = element.getKey()
    if (alreadyHandled.has(elementKey)) {
      logger.info('Already handled node', key)
      continue
    }

    alreadyHandled.add(elementKey)

    const initialFormatType = element.getFormatType()

    const existingSuggestion = element
      .getChildren()
      .find((node): node is ProtonNode => $isSuggestionNode(node) && node.getSuggestionTypeOrThrow() === 'align-change')

    if (existingSuggestion) {
      const originalFormatType = existingSuggestion.__properties.nodePropertiesChanged?.initialFormatType
      if (originalFormatType === undefined) {
        throw new Error("Existing align-change suggestion doesn't have initialFormat")
      }
      logger.info('Comparing existing suggestion format', { format: formatType, originalFormat: originalFormatType })
      if (originalFormatType === formatType) {
        logger.info('Removing existing suggestion as format was reset')
        $removeSuggestionNodeAndResolveIfNeeded(existingSuggestion)
      }
    } else {
      logger.info('Creating new suggestion node', suggestionID)
      $insertFirst(
        element,
        $createSuggestionNode(suggestionID, 'align-change', {
          initialFormatType,
        }),
      )
      didCreateSuggestion = true
    }

    element.setFormat(formatType)
  }

  if (didCreateSuggestion) {
    onSuggestionCreation(suggestionID)
  }

  return true
}
