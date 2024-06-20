import { $deleteTableColumn__EXPERIMENTAL } from '@lexical/table'
import { LexicalEditor } from 'lexical'

export function deleteColumnAtSelection(editor: LexicalEditor) {
  editor.update(
    () => {
      $deleteTableColumn__EXPERIMENTAL()
    },
    {
      onUpdate: () => editor.focus(),
    },
  )
}
