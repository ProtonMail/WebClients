import { clsx } from 'clsx'
import { Kbd } from '../../Components/atoms'
import type { KbdProps } from '../../Components/atoms'
import { isMac } from '../../Utils/isMac'
import { useDocsMessages } from '../../DocsDependenciesProvider'

const MacCommandKey = '\u{2318}'
const CtrlKey = 'Ctrl'
const ModifierKey = isMac() ? MacCommandKey : CtrlKey

export const shortcutKbdMessages = {
  shortcutKbd: {
    label: (shortcut: string) => `Keyboard shortcut: ${shortcut}`,
  },
}

export type ShortcutKbdProps = Omit<KbdProps, 'children' | 'ref'> & {
  shortcut: string
}

export function ShortcutKbd({ shortcut, className, ...props }: ShortcutKbdProps) {
  const messages = useDocsMessages().shortcutKbd
  return (
    <Kbd aria-label={messages.label(shortcut)} {...props} className={clsx('text-sm capitalize leading-4', className)}>
      {shortcut}
    </Kbd>
  )
}

export function ModifierKbd() {
  const messages = useDocsMessages().shortcutKbd
  return (
    <Kbd aria-label={messages.label(ModifierKey)} className="flex items-center justify-center text-lg leading-4">
      {ModifierKey}
    </Kbd>
  )
}
