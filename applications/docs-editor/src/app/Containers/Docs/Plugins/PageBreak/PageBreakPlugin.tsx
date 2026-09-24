import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { $insertNodeToNearestRoot } from '@lexical/utils'
import { $createParagraphNode, $getSelection, $isRangeSelection, COMMAND_PRIORITY_EDITOR } from 'lexical'
import { useEffect } from 'react'
import { $createPageBreakNode, INSERT_PAGE_BREAK_COMMAND } from './PageBreakNode'

export function PageBreakPlugin() {
  const [editor] = useLexicalComposerContext()

  useEffect(() => {
    return editor.registerCommand(
      INSERT_PAGE_BREAK_COMMAND,
      () => {
        const selection = $getSelection()
        if (!$isRangeSelection(selection)) {
          return false
        }

        const pageBreakNode = $insertNodeToNearestRoot($createPageBreakNode())
        if (!pageBreakNode.getNextSibling()) {
          const paragraph = $createParagraphNode()
          pageBreakNode.insertAfter(paragraph)
          paragraph.selectEnd()
        }

        return true
      },
      COMMAND_PRIORITY_EDITOR,
    )
  }, [editor])

  return null
}
