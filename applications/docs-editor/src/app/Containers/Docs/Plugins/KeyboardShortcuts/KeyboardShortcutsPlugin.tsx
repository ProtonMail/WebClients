import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { COMMAND_PRIORITY_NORMAL, KEY_DOWN_COMMAND } from 'lexical'
import { useEffect } from 'react'
import { KEYBOARD_SHORTCUT_COMMAND } from './Command'
import { getShortcutFromKeyboardEvent } from './Utils'

export function KeyboardShortcutsPlugin() {
  const [editor] = useLexicalComposerContext()
  useEffect(() => {
    return editor.registerCommand(
      KEY_DOWN_COMMAND,
      (event: KeyboardEvent) => {
        const shortcut = getShortcutFromKeyboardEvent(event)
        if (!shortcut) {
          return false
        }

        if (editor.dispatchCommand(KEYBOARD_SHORTCUT_COMMAND, { event, shortcut })) {
          event.preventDefault()
          return true
        }

        return false
      },
      COMMAND_PRIORITY_NORMAL,
    )
  }, [editor])

  return null
}
