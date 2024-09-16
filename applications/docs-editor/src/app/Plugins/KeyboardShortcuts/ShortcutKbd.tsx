import { Kbd } from '@proton/atoms'
import { isMac } from '@proton/shared/lib/helpers/browser'
import { type ComponentProps } from 'react'

const MacCommandKey = '\u{2318}'
const CtrlKey = 'Ctrl'
const ModifierKey = isMac() ? MacCommandKey : CtrlKey

export const ShortcutKbd = (props: ComponentProps<typeof Kbd>) => (
  <Kbd {...props} className="text-sm capitalize leading-4" />
)

export const ModifierKbd = () => (
  <Kbd className="flex items-center justify-center text-lg leading-4" shortcut={ModifierKey} />
)
