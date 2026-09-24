import { useEffect } from 'react'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'

export function EditorReadonlyPlugin({ editingEnabled }: { editingEnabled: boolean }) {
  const [editor] = useLexicalComposerContext()

  useEffect(() => {
    editor.setEditable(editingEnabled)
  }, [editingEnabled, editor])

  return null
}
