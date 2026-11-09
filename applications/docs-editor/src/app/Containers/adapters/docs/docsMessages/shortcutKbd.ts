import { c } from 'ttag'
import type { DocsMessages } from '@proton-docs/docs-editor'

// The label parameter stays `shortcut` because ttag builds the existing msgid from it.
export function createShortcutKbdMessages(): Pick<DocsMessages, 'shortcutKbd'> {
  return {
    shortcutKbd: {
      label: (shortcut: string) => c('Label').t`Keyboard shortcut: ${shortcut}`,
    },
  }
}
