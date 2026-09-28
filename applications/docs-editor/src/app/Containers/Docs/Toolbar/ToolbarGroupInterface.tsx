import type { ToolbarItemInterface } from './ToolbarItemInterface'

export type ToolbarGroupInterface = {
  id: string
  items: ToolbarItemInterface[]
  showInToolbar?: false
  className?: (visible: boolean) => string
}
