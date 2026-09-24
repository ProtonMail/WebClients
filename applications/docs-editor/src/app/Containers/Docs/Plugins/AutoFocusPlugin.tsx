import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { $getRoot } from 'lexical'
import { useEffect } from 'react'

export function AutoFocusPlugin({ isEditorHidden }: { isEditorHidden: boolean }) {
  const [editor] = useLexicalComposerContext()

  useEffect(() => {
    if (isEditorHidden) {
      return
    }

    const isEmpty = editor.getEditorState().read(() => {
      const root = $getRoot()
      return root.isEmpty()
    })

    const focusRootElement = () => {
      const activeElement = document.activeElement
      const rootElement = editor.getRootElement() as HTMLDivElement
      if (rootElement !== null && (activeElement === null || !rootElement.contains(activeElement))) {
        rootElement.focus({ preventScroll: true })
      }
    }

    if (isEmpty) {
      focusRootElement()
      return
    }

    editor.focus(focusRootElement, { defaultSelection: 'rootStart' })
  }, [editor, isEditorHidden])

  return null
}
