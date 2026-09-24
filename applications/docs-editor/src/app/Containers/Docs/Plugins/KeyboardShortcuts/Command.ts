import { createCommand } from 'lexical'
import type { KeyboardShortcutID } from './Types'

export const KEYBOARD_SHORTCUT_COMMAND = createCommand<{ event: KeyboardEvent; shortcut: KeyboardShortcutID }>(
  'KEYBOARD_SHORTCUT_COMMAND',
)
