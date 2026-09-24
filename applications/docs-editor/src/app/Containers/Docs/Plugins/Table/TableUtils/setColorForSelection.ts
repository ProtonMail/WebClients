import { $patchStyleText } from '@lexical/selection'
import { $isTableSelection } from '@lexical/table'
import type { LexicalEditor } from 'lexical'
import { $getSelection } from 'lexical'

export function setColorForSelection(editor: LexicalEditor, color: string | null) {
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
