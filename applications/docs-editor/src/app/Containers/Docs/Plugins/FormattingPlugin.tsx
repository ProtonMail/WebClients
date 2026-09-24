import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { $isHeadingNode, $isQuoteNode } from '@lexical/rich-text'
import { $patchStyleText } from '@lexical/selection'
import { $getNearestBlockElementAncestorOrThrow, mergeRegister } from '@lexical/utils'
import {
  $createParagraphNode,
  $getSelection,
  $isRangeSelection,
  $isTextNode,
  COMMAND_PRIORITY_NORMAL,
  createCommand,
} from 'lexical'
import { useEffect } from 'react'

export const SET_SELECTION_STYLE_PROPERTY_COMMAND = createCommand<{
  property: string
  value: string | null
}>('SET_SELECTION_STYLE_PROPERTY_COMMAND')

export const CLEAR_FORMATTING_COMMAND = createCommand('CLEAR_FORMATTING_COMMAND')

export function FormattingPlugin() {
  const [editor] = useLexicalComposerContext()

  useEffect(() => {
    return mergeRegister(
      editor.registerCommand(
        SET_SELECTION_STYLE_PROPERTY_COMMAND,
        ({ property, value }) => {
          if (!editor.isEditable()) {
            return false
          }
          const selection = $getSelection()
          if (selection === null) {
            return false
          }
          $patchStyleText(selection, {
            [property]: value,
          })
          return true
        },
        COMMAND_PRIORITY_NORMAL,
      ),
      editor.registerCommand(
        CLEAR_FORMATTING_COMMAND,
        () => {
          const selection = $getSelection()
          if (!$isRangeSelection(selection)) {
            return false
          }

          const anchor = selection.anchor
          const focus = selection.focus
          const nodes = selection.getNodes()
          const extractedNodes = selection.extract()

          const isCollapsed = anchor.key === focus.key && anchor.offset === focus.offset
          if (isCollapsed) {
            return false
          }

          if (!nodes.length) {
            return false
          }

          for (let index = 0; index < nodes.length; index++) {
            let node = nodes[index]
            if (!node) {
              throw new Error('Could not find node at index')
            }

            // We split the first and last node by the selection
            // So that we don't format unselected text inside those nodes
            if ($isTextNode(node)) {
              // Use a separate variable to ensure TS does not lose the refinement
              let textNode = node
              if (index === 0 && anchor.offset !== 0) {
                textNode = textNode.splitText(anchor.offset)[1] || textNode
              }
              if (index === nodes.length - 1) {
                textNode = textNode.splitText(focus.offset)[0] || textNode
              }

              /**
               * If the selected text has one format applied
               * selecting a portion of the text, could
               * clear the format to the wrong portion of the text.
               *
               * The cleared text is based on the length of the selected text.
               */
              // We need this in case the selected text only has one format
              const extractedTextNode = extractedNodes[0]
              if (nodes.length === 1 && $isTextNode(extractedTextNode)) {
                textNode = extractedTextNode
              }

              if (textNode.__style !== '') {
                textNode.setStyle('')
              }
              if (textNode.__format !== 0) {
                textNode.setFormat(0)
                $getNearestBlockElementAncestorOrThrow(textNode).setFormat('')
              }
              node = textNode
            } else if ($isHeadingNode(node) || $isQuoteNode(node)) {
              node.replace($createParagraphNode(), true)
            }
          }

          return false
        },
        COMMAND_PRIORITY_NORMAL,
      ),
    )
  }, [editor])

  return null
}
