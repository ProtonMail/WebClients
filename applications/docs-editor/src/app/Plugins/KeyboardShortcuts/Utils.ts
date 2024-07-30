import { isMac } from '@proton/shared/lib/helpers/browser'
import { CustomKeyboardShortcuts } from './CustomKeyboardShortcuts'
import type { KeyboardShortcutMatcher, KeyboardShortcutID } from './Types'

export const doesShortcutMatchEvent = (
  event: KeyboardEvent,
  hasModifier: boolean,
  shortcut: KeyboardShortcutMatcher,
): boolean =>
  !!shortcut.hasModifier === hasModifier &&
  !!shortcut.shiftKey === event.shiftKey &&
  !!shortcut.altKey === event.altKey &&
  ('key' in shortcut ? shortcut.key === event.key : true) &&
  ('code' in shortcut ? shortcut.code === event.code : true)

export const getShortcutFromKeyboardEvent = (event: KeyboardEvent): KeyboardShortcutID | undefined => {
  const { ctrlKey, metaKey } = event
  const hasModifier = isMac() ? metaKey : ctrlKey

  const result = CustomKeyboardShortcuts.find((shortcut) => doesShortcutMatchEvent(event, hasModifier, shortcut))
  return result?.id
}
