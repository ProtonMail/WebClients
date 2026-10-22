import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { mergeRegister } from '@lexical/utils'
import { COMMAND_PRIORITY_HIGH, PASTE_COMMAND } from 'lexical'
import { useEffect } from 'react'
import { useDocsMessages } from '../DocsDependenciesProvider'

const PASTE_LIMIT_BYTES = 1_000_000

export function PasteLimitPlugin({ showGenericAlertModal }: { showGenericAlertModal: (message: string) => void }) {
  const [editor] = useLexicalComposerContext()
  const { tooLarge } = useDocsMessages().paste

  useEffect(() => {
    const onPaste = (event: ClipboardEvent) => {
      const paste = event.clipboardData?.getData('Text') || ''
      const size = new Blob([paste]).size
      if (size < PASTE_LIMIT_BYTES) {
        return false
      }

      showGenericAlertModal(tooLarge)
      event.preventDefault()
      return true
    }

    return mergeRegister(
      editor.registerCommand<ClipboardEvent>(
        PASTE_COMMAND,
        (event: ClipboardEvent) => {
          return onPaste(event)
        },
        COMMAND_PRIORITY_HIGH,
      ),
    )
  }, [editor, showGenericAlertModal, tooLarge])

  return null
}
