import type { ReactElement } from 'react'

import { DropdownMenuItem } from '../menu'

export interface ContextMenuButtonProps {
  name: string
  icon: ReactElement<any>
  action: () => void
  close: () => void
  disabled?: boolean
}

export function ContextMenuButton({ name, icon, action, close, disabled }: ContextMenuButtonProps) {
  return (
    <DropdownMenuItem
      // Ariakit renders the item's children, its label, inside the button.
      // eslint-disable-next-line jsx-a11y/control-has-associated-label
      render={<button type="button" />}
      disabled={disabled}
      // The item closes the menu through `close`, which "Move to trash" leaves empty to show "Trashing...".
      hideOnClick={false}
      onContextMenu={(e) => e.stopPropagation()}
      onClick={(e) => {
        // Proton's dropdown closes on any other click inside it.
        e.stopPropagation()
        action()
        close()
      }}
    >
      <div className="flex shrink-0 flex-nowrap items-center text-left">
        {icon}
        {name}
      </div>
    </DropdownMenuItem>
  )
}
