import { $forEachSelectedTextNode, $patchStyleText, getStyleObjectFromCSS } from '@lexical/selection'
import type { DocsLogger } from '../../contract/DocsLogger'
import { $getSelection, $isRangeSelection, $setSelection } from 'lexical'
import { v4 as uuidv4 } from 'uuid'
import type { ProtonNode } from './ProtonNode'
import { $createSuggestionNode, $isSuggestionNode } from './ProtonNode'
import { $findMatchingParent, $wrapNodeInElement } from '@lexical/utils'

export function $patchStyleAsSuggestion(
  property: string,
  value: string | null,
  onSuggestionCreation: (id: string) => void,
  logger: DocsLogger,
): boolean {
  logger.info(`suggestion-mode: Patching style as suggestion ${property} ${value}`)
  const selection = $getSelection()

  const patch = {
    [property]: value,
  }

  if (!$isRangeSelection(selection)) {
    logger.info('suggestion-mode: Selection is not range selection')
    return true
  }

  if (selection.isCollapsed()) {
    logger.info('suggestion-mode: Patching selection directly as it is collapsed')
    $patchStyleText(selection, patch)
    return true
  }

  const suggestionID = uuidv4()

  $forEachSelectedTextNode((textNode) => {
    const styleSuggestionParent = $findMatchingParent(
      textNode,
      (n): n is ProtonNode => $isSuggestionNode(n) && n.getSuggestionTypeOrThrow() === 'style-change',
    )

    const styleObj = getStyleObjectFromCSS(textNode.getStyle())
    const existingValue = styleObj[property] || null

    if (!styleSuggestionParent) {
      $wrapNodeInElement(textNode, () =>
        $createSuggestionNode(suggestionID, 'style-change', {
          [property]: existingValue,
        }),
      ) as ProtonNode
    } else {
      const props = styleSuggestionParent.getSuggestionChangedProperties()
      if (props && props[property] === undefined) {
        const writable = styleSuggestionParent.getWritable()
        writable.__properties.nodePropertiesChanged![property] = existingValue
      }
    }

    const selectionToPatch = textNode.select(0, textNode.getTextContentSize())
    $patchStyleText(selectionToPatch, patch)
  })

  $setSelection(selection.clone())

  onSuggestionCreation(suggestionID)

  return true
}
