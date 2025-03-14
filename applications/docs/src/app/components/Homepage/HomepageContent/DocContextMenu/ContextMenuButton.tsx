import type { PropsWithChildren, ReactElement } from 'react'

import type { IconName } from '@proton/components'
import { DropdownMenuButton, Icon } from '@proton/components'

export type ContextMenuButtonProps = {
  name: string
  icon: IconName | ReactElement<any>
  action: () => void
  close: () => void
}

export function ContextMenuButton({ name, icon, action, close, children }: PropsWithChildren<ContextMenuButtonProps>) {
  return (
    <DropdownMenuButton
      key={name}
      onContextMenu={(e) => e.stopPropagation()}
      className="justify-space-between flex flex-nowrap items-center"
      onClick={(e) => {
        e.stopPropagation()
        action()
        close()
      }}
    >
      <div className="flex shrink-0 flex-nowrap items-center text-left">
        {typeof icon === 'string' ? <Icon className="mr-2 shrink-0" name={icon} /> : icon}
        {name}
      </div>
      {children}
    </DropdownMenuButton>
  )
}
