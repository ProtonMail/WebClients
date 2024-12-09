import type { ReactNode } from 'react'
import type { KeyboardShortcutID } from '../Plugins/KeyboardShortcuts/Types'

export type ToolbarButtonItemInterface = {
  type: 'button'
  onClick: () => void
  icon: ReactNode
  label: string
  shortcut?: KeyboardShortcutID
}
