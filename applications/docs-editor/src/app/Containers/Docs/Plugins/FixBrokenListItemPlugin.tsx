import { $createListItemNode, $isListNode, ListItemNode } from '@lexical/list'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { useEffect } from 'react'

/**
 * Toggling a list at an empty nested list item and then immediately typing causes
 * a state where a list item can have a nested list along with text. While this is not problematic
 * on its own, pressing Enter in the inserted text node causes the page to freeze because
 * of an infinite loop in the way Lexical handles node splitting.
 * To verify whether this plugin is still needed, run the skipped test in the corresponding test file.
 */
export function FixBrokenListItemPlugin() {
  const [editor] = useLexicalComposerContext()

  useEffect(() => {
    return editor.registerNodeTransform(ListItemNode, function $splitListItemIntoMultiple(node: ListItemNode) {
      const children = node.getChildren()
      if (children.length <= 1) {
        return
      }
      if (!$isListNode(children[0])) {
        return
      }
      const childrenExceptList = children.slice(1)
      const listItem = $createListItemNode()
      for (const child of childrenExceptList) {
        child.remove()
        listItem.append(child)
      }
      node.insertAfter(listItem)
    })
  }, [editor])

  return null
}
