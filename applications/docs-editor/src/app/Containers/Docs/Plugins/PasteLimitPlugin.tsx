import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { mergeRegister } from '@lexical/utils'
import { COMMAND_PRIORITY_HIGH, PASTE_COMMAND } from 'lexical'
import { useEffect } from 'react'
import { c } from 'ttag'

const PASTE_LIMIT_BYTES = 1_000_000

export function PasteLimitPlugin({ showGenericAlertModal }: { showGenericAlertModal: (message: string) => void }) {
  const [editor] = useLexicalComposerContext()

  const onPaste = (event: ClipboardEvent) => {
    const paste = event.clipboardData?.getData('Text') || ''
    const size = new Blob([paste]).size
    if (size < PASTE_LIMIT_BYTES) {
      return false
    }

    showGenericAlertModal(
      c('Info')
        .t`The content you are attempting to paste is too large to be pasted at once. Try again by pasting in smaller pieces at a time.`,
    )
    event.preventDefault()
    return true
  }

  useEffect(() => {
    return mergeRegister(
      editor.registerCommand<ClipboardEvent>(
        PASTE_COMMAND,
        (event: ClipboardEvent) => {
          return onPaste(event)
        },
        COMMAND_PRIORITY_HIGH,
      ),
    )
  }, [editor])

  return null
}
