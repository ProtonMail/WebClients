import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { $findMatchingParent, mergeRegister } from '@lexical/utils'
import { $getSelection, $isRangeSelection, COMMAND_PRIORITY_EDITOR } from 'lexical'
import { useEffect } from 'react'
import { INSERT_CUSTOM_ORDERED_LIST_COMMAND } from './CustomListCommands'
import { insertList } from '@lexical/list'
import { $isCustomListNode } from './$isCustomListNode'

export function CustomOrderedListPlugin() {
  const [editor] = useLexicalComposerContext()
  useEffect(() => {
    return mergeRegister(
      editor.registerCommand(
        INSERT_CUSTOM_ORDERED_LIST_COMMAND,
        ({ type, marker = 'period' }) => {
          insertList(editor, 'number')

          if (!type) {
            return true
          }

          editor.update(() => {
            const selection = $getSelection()
            if (!$isRangeSelection(selection)) {
              return false
            }

            const listNode = $findMatchingParent(selection.focus.getNode(), $isCustomListNode)
            if (!listNode) {
              return false
            }

            listNode.setListStyleType(type)
            listNode.setMarker(marker)
          })

          return true
        },
        COMMAND_PRIORITY_EDITOR,
      ),
    )
  }, [editor])

  return null
}
