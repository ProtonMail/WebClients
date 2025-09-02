import { useMemo } from 'react'
import { CustomKeyboardShortcuts } from './CustomKeyboardShortcuts'
import { DefaultKeyboardShortcuts } from './DefaultKeyboardShortcuts'
import type { KeyboardShortcutID } from './Types'
import { ModifierKbd, ShortcutKbd } from './ShortcutKbd'
import { isMac } from '@proton/shared/lib/helpers/browser'
import { ShortcutLabelContainer } from './ShortcutLabelContainer'
import { ShortcutLabelText } from './ShortcutLabelText'

const AltDisplayKey = isMac() ? 'Option' : 'Alt'

export const ShortcutLabel = ({ shortcut, label }: { shortcut: KeyboardShortcutID; label?: string }) => {
  const shortcutAttributes = useMemo(
    () => [...DefaultKeyboardShortcuts, ...CustomKeyboardShortcuts].find(({ id }) => id === shortcut),
    [shortcut],
  )
  if (!shortcutAttributes) {
    return null
  }

  return (
    <ShortcutLabelContainer>
      {label && (
        <>
          <ShortcutLabelText>{label}</ShortcutLabelText>
          <span className="pr-0.5" />
        </>
      )}
      {'hasModifier' in shortcutAttributes && shortcutAttributes.hasModifier && <ModifierKbd />}
      {'altKey' in shortcutAttributes && shortcutAttributes.altKey && <ShortcutKbd shortcut={AltDisplayKey} />}
      {'shiftKey' in shortcutAttributes && shortcutAttributes.shiftKey && <ShortcutKbd shortcut="Shift" />}
      {'key' in shortcutAttributes && shortcutAttributes.key && (
        <ShortcutKbd className="capitalize" shortcut={shortcutAttributes.key} />
      )}
      {'displayKey' in shortcutAttributes && shortcutAttributes.displayKey && (
        <ShortcutKbd className="capitalize" shortcut={shortcutAttributes.displayKey} />
      )}
    </ShortcutLabelContainer>
  )
}
