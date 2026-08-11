import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { mergeRegister } from '@lexical/utils'
import { COMMAND_PRIORITY_HIGH, PASTE_COMMAND } from 'lexical'
import { useEffect } from 'react'
import { c } from 'ttag'

const MAX_COMBINING_MARKS_PER_BASE_CHARACTER = 10
const COMBINING_MARK_PATTERN = /\p{M}/u

export function exceedsDepthCheck(text: string): boolean {
  let depth = 0
  for (const char of text) {
    if (COMBINING_MARK_PATTERN.test(char)) {
      depth++
      if (depth > MAX_COMBINING_MARKS_PER_BASE_CHARACTER) {
        return true
      }
    } else {
      depth = 0
    }
  }
  return false
}

export function pasteExceedsDepth(clipboardData: DataTransfer | null | undefined): boolean {
  const html = clipboardData?.getData('text/html') || ''
  const text = clipboardData?.getData('Text') || ''
  return exceedsDepthCheck(html) || exceedsDepthCheck(text)
}

/**
 * Blocks paste payloads with pathological Unicode combining-mark sequences.
 */
export function CombiningMarkPasteGuardPlugin({
  showGenericAlertModal,
}: {
  showGenericAlertModal: (message: string) => void
}) {
  const [editor] = useLexicalComposerContext()

  const onPaste = (event: ClipboardEvent) => {
    if (!pasteExceedsDepth(event.clipboardData)) {
      return false
    }

    showGenericAlertModal(c('Info').t`This paste was blocked because the text contains invalid characters.`)
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
