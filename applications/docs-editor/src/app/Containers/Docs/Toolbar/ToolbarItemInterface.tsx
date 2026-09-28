import type { ReactNode } from 'react'
import type { ToolbarButtonItemInterface } from './ToolbarButtonItemInterface'
import type { ToolbarDropdownItemInterface } from './ToolbarDropdownItemInterface'

export type ToolbarItemInterface = {
  id: string
  type: 'button' | 'dropdown'
  disabled: boolean
  active?: boolean
  tooltip?: ReactNode
} & (ToolbarButtonItemInterface | ToolbarDropdownItemInterface)
