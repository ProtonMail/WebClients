import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { $patchStyleText } from '@lexical/selection'
import { mergeRegister } from '@lexical/utils'
import { $getSelection, COMMAND_PRIORITY_NORMAL, createCommand } from 'lexical'
import { useEffect } from 'react'

export const SET_SELECTION_STYLE_PROPERTY_COMMAND = createCommand<{
  property: string
  value: string | null
}>('SET_SELECTION_STYLE_PROPERTY_COMMAND')

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
    )
  }, [editor])

  return null
}
