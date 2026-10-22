import { c } from 'ttag'
import type { DocsMessages } from '../../../Docs/public'

// The label parameter stays `shortcut` because ttag builds the existing msgid from it.
export function createShortcutKbdMessages(): Pick<DocsMessages, 'shortcutKbd'> {
  return {
    shortcutKbd: {
      label: (shortcut: string) => c('Label').t`Keyboard shortcut: ${shortcut}`,
    },
  }
}
