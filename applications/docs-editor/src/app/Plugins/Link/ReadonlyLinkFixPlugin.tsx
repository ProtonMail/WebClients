import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { useLexicalEditable } from '@lexical/react/useLexicalEditable'
import { useEffect } from 'react'

/**
 * Since the editor is in an iframe, clicking on a link in readonly mode
 * will open the link in the same iframe. This plugin will prevent that
 * by asking the parent window to open the link in a new tab.
 */
export function ReadonlyLinkFixPlugin({ openLink }: { openLink: (url: string) => void }) {
  const [editor] = useLexicalComposerContext()
  const isEditorEditable = useLexicalEditable()

  useEffect(() => {
    if (isEditorEditable) {
      return
    }

    const root = editor.getRootElement()
    if (!root) {
      return
    }

    const handleClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      const link = target.closest('a')
      if (link) {
        event.preventDefault()
        event.stopPropagation()
        openLink(link.href)
      }
    }

    root.addEventListener('click', handleClick)

    return () => {
      root.removeEventListener('click', handleClick)
    }
  }, [openLink, editor, isEditorEditable])

  return null
}
