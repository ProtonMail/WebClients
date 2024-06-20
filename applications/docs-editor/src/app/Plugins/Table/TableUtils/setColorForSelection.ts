import { $patchStyleText } from '@lexical/selection'
import { $isTableSelection } from '@lexical/table'
import { $getSelection, LexicalEditor } from 'lexical'

export function setColorForSelection(editor: LexicalEditor, color: string) {
  editor.update(
    () => {
      const selection = $getSelection()
      if (!$isTableSelection(selection)) {
        return
      }
      $patchStyleText(selection, { color })
    },
    {
      onUpdate: () => editor.focus(),
    },
  )
}
