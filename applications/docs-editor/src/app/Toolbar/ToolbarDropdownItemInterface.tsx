import type { DropdownProps } from '@proton/components'
import type { ReactNode } from 'react'

export type ToolbarDropdownItemInterface = {
  type: 'dropdown'
  menu: ReactNode
  dropdownProps: Partial<DropdownProps>
  useToolbarButton?: boolean
  overflowBehavior: 'submenu' | 'spread-items'
  label: (target: 'toolbar' | 'overflow') => ReactNode
  hasCaret?: boolean
}
