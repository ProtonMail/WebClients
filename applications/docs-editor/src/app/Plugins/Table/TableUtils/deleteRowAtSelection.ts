import { $deleteTableRow__EXPERIMENTAL } from '@lexical/table'
import { LexicalEditor } from 'lexical'

export function deleteRowAtSelection(editor: LexicalEditor) {
  editor.update(
    () => {
      $deleteTableRow__EXPERIMENTAL()
    },
    {
      onUpdate: () => editor.focus(),
    },
  )
}
