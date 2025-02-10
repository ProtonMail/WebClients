import { $createLinkNode, TOGGLE_LINK_COMMAND, type LinkNode } from '@lexical/link'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { LinkPlugin } from '@lexical/react/LexicalLinkPlugin'
import type { TextNode } from 'lexical'
import {
  $createTextNode,
  $getSelection,
  $insertNodes,
  $isElementNode,
  $isRangeSelection,
  COMMAND_PRIORITY_LOW,
  COMMAND_PRIORITY_NORMAL,
  createCommand,
  PASTE_COMMAND,
} from 'lexical'
import { useEffect } from 'react'
import { sanitizeUrl } from '../../Utils/sanitizeUrl'
import { mergeRegister } from '@lexical/utils'

export type LinkChangePayload = {
  linkNode: LinkNode | null
  url: string | null
  linkTextNode: TextNode | null
  text: string | null
}
export const LINK_CHANGE_COMMAND = createCommand<LinkChangePayload>('LINK_CHANGE_COMMAND')

export function ProtonLinkPlugin() {
  const [editor] = useLexicalComposerContext()

  useEffect(() => {
    return mergeRegister(
      editor.registerCommand(
        LINK_CHANGE_COMMAND,
        ({ linkNode, url, linkTextNode, text }) => {
          const selection = $getSelection()
          if (!$isRangeSelection(selection)) {
            return false
          }

          if (!url) {
            return editor.dispatchCommand(TOGGLE_LINK_COMMAND, null)
          }

          const sanitizedURL = sanitizeUrl(url.startsWith('http') ? url : 'https://' + url)

          const isSelectionCollapsed = selection.isCollapsed()
          if (isSelectionCollapsed && url && !linkNode) {
            if (sanitizedURL.isFailed()) {
              return false
            }
            const linkNode = $createLinkNode(sanitizedURL.getValue())
            const textNode = $createTextNode(text || url)
            linkNode.append(textNode)
            $insertNodes([linkNode])
            linkNode.selectEnd()
            return true
          }

          if (sanitizedURL.isFailed()) {
            return false
          }

          editor.dispatchCommand(TOGGLE_LINK_COMMAND, sanitizedURL.getValue())

          if (linkTextNode !== null && !!text) {
            linkTextNode.setTextContent(text)
          }

          return true
        },
        COMMAND_PRIORITY_NORMAL,
      ),
      editor.registerCommand(
        PASTE_COMMAND,
        function applyLinkFromClipboard(event) {
          const selection = $getSelection()
          if (!$isRangeSelection(selection) || !(event instanceof ClipboardEvent)) {
            return false
          }
          const clipboardText = event.clipboardData?.getData('text')
          if (!clipboardText) {
            return false
          }
          const sanitizedURL = sanitizeUrl(clipboardText)
          if (sanitizedURL.isFailed()) {
            return false
          }
          if (!selection.getNodes().some((node) => $isElementNode(node))) {
            editor.dispatchCommand(LINK_CHANGE_COMMAND, {
              url: clipboardText,
              linkNode: null,
              linkTextNode: null,
              text: null,
            })
            event.preventDefault()
            return true
          }
          return false
        },
        COMMAND_PRIORITY_LOW,
      ),
    )
  }, [editor])

  return (
    <>
      <LinkPlugin />
    </>
  )
}
