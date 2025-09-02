import type { CustomKeyboardShortcuts } from './CustomKeyboardShortcuts'
import type { DefaultKeyboardShortcuts } from './DefaultKeyboardShortcuts'

export type KeyboardShortcutMatcher = {
  id: string
  hasModifier?: boolean
  shiftKey?: boolean
  altKey?: boolean
} & (
  | {
      key: string
    }
  | {
      code: string
      displayKey: string
    }
)

export type KeyboardShortcutID =
  | (typeof CustomKeyboardShortcuts)[number]['id']
  | (typeof DefaultKeyboardShortcuts)[number]['id']
