import { isMac } from '@proton/shared/lib/helpers/browser'
import type { KeyboardShortcutMatcher } from './Types'

export const DefaultKeyboardShortcuts = Object.freeze([
  {
    id: 'UNDO_SHORTCUT',
    hasModifier: true,
    key: 'z',
  },
  {
    id: 'REDO_SHORTCUT',
    hasModifier: true,
    key: isMac() ? 'z' : 'y',
    shiftKey: isMac() ? true : false,
  },
  {
    id: 'BOLD_SHORTCUT',
    hasModifier: true,
    key: 'b',
  },
  {
    id: 'ITALIC_SHORTCUT',
    hasModifier: true,
    key: 'i',
  },
  {
    id: 'UNDERLINE_SHORTCUT',
    hasModifier: true,
    key: 'u',
  },
] as const) satisfies readonly KeyboardShortcutMatcher[]
