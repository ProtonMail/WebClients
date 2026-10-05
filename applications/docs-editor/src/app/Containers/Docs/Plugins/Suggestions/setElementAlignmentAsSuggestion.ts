import { $findMatchingParent, $insertFirst } from '@lexical/utils'
import type { ElementNode } from 'lexical'
import { $getSelection, $isElementNode, $isRangeSelection, type ElementFormatType } from 'lexical'
import type { ProtonNode } from './ProtonNode'
import { $createSuggestionNode, $isSuggestionNode } from './ProtonNode'
import { v4 as uuidv4 } from 'uuid'
import { $removeSuggestionNodeAndResolveIfNeeded } from './removeSuggestionNodeAndResolveIfNeeded'
import type { DocsLogger } from '../../contract/DocsLogger'
import { $isListNode } from '@lexical/list'
import type { AlignChangeSuggestionProperties } from './Types'

export function $setElementAlignmentAsSuggestion(
  formatType: ElementFormatType,
  onSuggestionCreation: (id: string) => void,
  logger: DocsLogger,
): boolean {
  logger.info('suggestion-mode: Setting element alignment', formatType)

  const selection = $getSelection()
  if (!$isRangeSelection(selection)) {
    logger.info('suggestion-mode: Selection is not range selection')
    return true
  }

  const nodes = selection.getNodes()
  const alreadyHandled = new Set()

  const suggestionID = uuidv4()
  let didCreateSuggestion = false

  for (const node of nodes) {
    const key = node.getKey()
    if (alreadyHandled.has(key)) {
      logger.info('suggestion-mode: Already handled node', key)
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
      logger.info('suggestion-mode: Could not find non-inline element parent')
      continue
    }

    const elementKey = element.getKey()
    if (alreadyHandled.has(elementKey)) {
      logger.info('suggestion-mode: Already handled node', key)
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
      logger.info('suggestion-mode: Comparing existing suggestion format', {
        format: formatType,
        originalFormat: originalFormatType,
      })
      if (originalFormatType === formatType) {
        logger.info('suggestion-mode: Removing existing suggestion as format was reset')
        $removeSuggestionNodeAndResolveIfNeeded(existingSuggestion)
      }
    } else {
      logger.info('suggestion-mode: Creating new suggestion node', suggestionID)
      $insertFirst(
        element,
        $createSuggestionNode(suggestionID, 'align-change', {
          initialFormatType,
        } satisfies AlignChangeSuggestionProperties),
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
