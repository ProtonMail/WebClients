import { $createLinkNode, $isAutoLinkNode, $isLinkNode, TOGGLE_LINK_COMMAND } from '@lexical/link'
import { $findMatchingParent, $wrapNodeInElement } from '@lexical/utils'
import type { LexicalEditor } from 'lexical'
import { $getSelection, $isRangeSelection, $createTextNode } from 'lexical'
import { GenerateUUID } from '@proton/docs-core'
import { sanitizeUrl } from '../../Utils/sanitizeUrl'
import type { LinkChangePayload } from '../Link/LinkPlugin'
import { $createSuggestionNode, $isSuggestionNode } from './ProtonNode'
import { $wrapSelectionInSuggestionNode } from './Utils'
import type { Logger } from '@proton/utils/logs'

export function $handleLinkChangeSuggestion(
  editor: LexicalEditor,
  { linkNode, url, linkTextNode, text }: LinkChangePayload,
  logger: Logger,
  onSuggestionCreation: (id: string) => void,
): boolean {
  const selection = $getSelection()
  if (!$isRangeSelection(selection)) {
    return true
  }

  const suggestionID = GenerateUUID()

  const sanitizedURL = url ? sanitizeUrl(url.startsWith('http') ? url : 'https://' + url) : null

  const isSelectionCollapsed = selection.isCollapsed()
  const shouldCreateNewLink = isSelectionCollapsed && url && !linkNode
  if (shouldCreateNewLink) {
    if (!sanitizedURL || sanitizedURL.isFailed()) {
      return true
    }
    const linkNode = $createLinkNode(sanitizedURL.getValue())
    linkNode.append($createTextNode(text || url))
    const suggestion = $createSuggestionNode(suggestionID, 'insert').append(linkNode)
    logger.info(`Inserting new link node as suggestion ${url}`)
    selection.insertNodes([suggestion])
    onSuggestionCreation(suggestionID)
    linkNode.selectEnd()
    return true
  }

  let currentLinkNode = linkNode
  if (!linkNode) {
    const nodes = selection.getNodes()
    for (const node of nodes) {
      const parent = node.getParent()
      if ($isAutoLinkNode(parent)) {
        continue
      }
      if ($isLinkNode(parent)) {
        currentLinkNode = parent
        break
      }
    }
  }

  const hasLinkTextChanged = linkTextNode && text && linkTextNode.getTextContent() !== text
  if (hasLinkTextChanged) {
    const newText = $createTextNode(text)
    const insertSuggestion = $createSuggestionNode(suggestionID, 'insert')
    insertSuggestion.append(newText)

    const deleteSuggestion = $wrapNodeInElement(linkTextNode, () => $createSuggestionNode(suggestionID, 'delete'))
    deleteSuggestion.insertBefore(insertSuggestion)
  }

  if (sanitizedURL && sanitizedURL.isFailed()) {
    return true
  }

  const existingSuggestion = $findMatchingParent(currentLinkNode || selection.focus.getNode(), $isSuggestionNode)

  const shouldCreateNewSuggestionNode = existingSuggestion?.getSuggestionTypeOrThrow() !== 'link-change'

  if (shouldCreateNewSuggestionNode) {
    if (currentLinkNode) {
      const initialURL = currentLinkNode.getURL()
      $wrapNodeInElement(currentLinkNode, () =>
        $createSuggestionNode(suggestionID, 'link-change', {
          __url: initialURL,
        }),
      )
    } else {
      $wrapSelectionInSuggestionNode(selection, selection.isBackward(), suggestionID, 'link-change', {
        __url: null,
      })
    }
    onSuggestionCreation(suggestionID)
  }

  editor.dispatchCommand(TOGGLE_LINK_COMMAND, sanitizedURL?.getValue() || null)

  return true
}
