import { clsx } from 'clsx'
import { c } from 'ttag'
import { Kbd } from '../../Components/atoms'
import type { KbdProps } from '../../Components/atoms'
import { isMac } from '../../Utils/isMac'

const MacCommandKey = '\u{2318}'
const CtrlKey = 'Ctrl'
const ModifierKey = isMac() ? MacCommandKey : CtrlKey

const keyboardShortcutLabel = (shortcut: string) => c('Label').t`Keyboard shortcut: ${shortcut}`

export type ShortcutKbdProps = Omit<KbdProps, 'children' | 'ref'> & {
  shortcut: string
}

export function ShortcutKbd({ shortcut, className, ...props }: ShortcutKbdProps) {
  return (
    <Kbd
      aria-label={keyboardShortcutLabel(shortcut)}
      {...props}
      className={clsx('text-sm capitalize leading-4', className)}
    >
      {shortcut}
    </Kbd>
  )
}

export function ModifierKbd() {
  return (
    <Kbd aria-label={keyboardShortcutLabel(ModifierKey)} className="flex items-center justify-center text-lg leading-4">
      {ModifierKey}
    </Kbd>
  )
}
