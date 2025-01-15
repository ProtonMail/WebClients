import { mergeRegister } from '@lexical/utils'
import type { Provider } from '@lexical/yjs'
import { setLocalStateFocus } from '@lexical/yjs'
import type { LexicalEditor } from 'lexical'
import { FOCUS_COMMAND, COMMAND_PRIORITY_EDITOR, BLUR_COMMAND } from 'lexical'
import { useEffect } from 'react'

export function useYjsFocusTracking(
  editor: LexicalEditor,
  provider: Provider,
  name: string,
  color: string,
  awarenessData: object,
) {
  useEffect(() => {
    return mergeRegister(
      editor.registerCommand(
        FOCUS_COMMAND,
        () => {
          setLocalStateFocus(provider, name, color, true, awarenessData || {})
          return false
        },
        COMMAND_PRIORITY_EDITOR,
      ),
      editor.registerCommand(
        BLUR_COMMAND,
        () => {
          setLocalStateFocus(provider, name, color, false, awarenessData || {})
          return false
        },
        COMMAND_PRIORITY_EDITOR,
      ),
    )
  }, [color, editor, name, provider, awarenessData])
}
