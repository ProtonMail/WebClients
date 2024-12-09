import { DropdownMenuButton, SimpleDropdown } from '@proton/components'
import clsx from '@proton/utils/clsx'
import { ShortcutLabel } from '../Plugins/KeyboardShortcuts/ShortcutLabel'
import type { ToolbarItemInterface } from './ToolbarItemInterface'
import ToolbarTooltip from './ToolbarTooltip'

export function OverflowMenuItem({ item }: { item: ToolbarItemInterface }) {
  if (item.type === 'button') {
    const button = (
      <DropdownMenuButton
        className={clsx('flex items-center gap-2 text-left text-sm', item.active && 'active')}
        onClick={item.onClick}
        disabled={item.disabled}
        data-testid={`overflow-${item.id}`}
      >
        {item.icon}
        {item.label}
      </DropdownMenuButton>
    )

    if (item.shortcut) {
      return (
        <ToolbarTooltip title={<ShortcutLabel shortcut={item.shortcut} />} originalPlacement="right">
          {button}
        </ToolbarTooltip>
      )
    }

    return button
  }

  if (item.overflowBehavior === 'spread-items') {
    return item.menu
  }

  return (
    <SimpleDropdown
      as={DropdownMenuButton}
      className="flex items-center justify-between gap-2 px-2 text-left text-sm"
      content={item.label('overflow')}
      disabled={item.disabled}
      contentProps={item.dropdownProps}
      data-submenu-button
    >
      {item.menu}
    </SimpleDropdown>
  )
}
