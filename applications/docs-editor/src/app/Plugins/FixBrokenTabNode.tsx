import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { $createTextNode, $getNodeByKey, $isTabNode } from 'lexical'
import { useEffect } from 'react'

/**
 * There was a bug in Lexical versions < 0.32.1 where if the selection was on a
 * TabNode and the user typed, the TabNode's text content would be updated
 * instead of a new TextNode being created after the TabNode. This plugin
 * listens for TabNodes that have non-tab text content and fixes them by
 * creating a new TextNode after the TabNode and resetting the TabNode's text
 * content to a tab character.
 */
export function FixBrokenTabNode() {
  const [editor] = useLexicalComposerContext()

  useEffect(
    () =>
      editor.registerUpdateListener(({ editorState, dirtyLeaves }) => {
        editorState.read(() => {
          if (dirtyLeaves.size === 0) {
            return
          }
          for (const nodeKey of dirtyLeaves) {
            const node = $getNodeByKey(nodeKey)
            if (!node || !$isTabNode(node)) {
              continue
            }
            const text = node.getTextContent()
            if (text === '\t') {
              continue
            }
            setTimeout(() => {
              editor.update(() => {
                const textNode = $createTextNode(text)
                node.insertAfter(textNode)
                node.setTextContent('\t')
              })
            })
          }
        })
      }),
    [editor],
  )

  return null
}
