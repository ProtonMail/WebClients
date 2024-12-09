import type { ReactNode } from 'react'

export type ToolbarDropdownItemInterface = {
  type: 'dropdown'
  menu: ReactNode
  dropdownProps: {
    onClosed: () => void
  }
  useToolbarButton?: boolean
  overflowBehavior: 'submenu' | 'spread-items'
  label: (target: 'toolbar' | 'overflow') => ReactNode
}
