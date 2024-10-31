import { $findMatchingParent, $insertFirst } from '@lexical/utils'
import type { ElementNode } from 'lexical'
import { $getSelection, $isRangeSelection, $isElementNode } from 'lexical'
import { $createSuggestionNode, $isSuggestionNode } from './ProtonNode'
import { GenerateUUID } from '@proton/docs-core'
import type { Logger } from '@proton/utils/logs'
import type { IndentChangeSuggestionProperties } from './Types'

export function $handleIndentOutdentAsSuggestion(
  type: 'indent' | 'outdent',
  onSuggestionCreation: (id: string) => void,
  logger: Logger,
): boolean {
  logger.info(`Handling ${type}`)

  const selection = $getSelection()
  if (!$isRangeSelection(selection)) {
    logger.info('Current selection is not range selection')
    return false
  }

  const alreadyHandled = new Set()
  const nodes = selection.getNodes()
  const suggestionID = GenerateUUID()

  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i]
    const key = node.getKey()

    if (alreadyHandled.has(key)) {
      logger.info('Already handled node', key)
      continue
    }

    const parentBlock = $findMatchingParent(
      node,
      (parentNode): parentNode is ElementNode => $isElementNode(parentNode) && !parentNode.isInline(),
    )
    if (parentBlock === null) {
      logger.info('Could not find non-inline parent element')
      continue
    }

    const parentKey = parentBlock.getKey()

    if (!parentBlock.canIndent()) {
      logger.info('Cannot indent parent')
      continue
    }

    if (alreadyHandled.has(parentKey)) {
      logger.info('Already handled parent')
      continue
    }

    alreadyHandled.add(parentKey)

    const currentIndent = parentBlock.getIndent()
    logger.info('Current indent level', currentIndent)

    let newIndent = currentIndent
    if (type === 'indent') {
      newIndent = currentIndent + 1
    } else if (currentIndent > 0) {
      newIndent = currentIndent - 1
    }
    parentBlock.setIndent(newIndent)

    const parentBlockChildren = parentBlock.getChildren()

    const existingIndentChangeSuggestion = parentBlockChildren.find(
      (node) => $isSuggestionNode(node) && node.getSuggestionTypeOrThrow() === 'indent-change',
    )

    if (!existingIndentChangeSuggestion && currentIndent !== newIndent) {
      logger.info('Adding indent-change suggestion')
      const suggestionNode = $createSuggestionNode(suggestionID, 'indent-change', {
        indent: currentIndent,
      } satisfies IndentChangeSuggestionProperties)
      $insertFirst(parentBlock, suggestionNode)
    }
  }

  if (alreadyHandled.size > 0) {
    logger.info('Created at least one suggestion', suggestionID)
    onSuggestionCreation(suggestionID)
  }

  return alreadyHandled.size > 0
}
