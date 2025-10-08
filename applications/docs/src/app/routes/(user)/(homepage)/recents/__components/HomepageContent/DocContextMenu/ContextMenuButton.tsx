import type { ComponentPropsWithoutRef, PropsWithChildren, ReactElement } from 'react'

import { DropdownMenuButton, Icon } from '@proton/components'
import type { IconName } from '@proton/icons/types'
import clsx from '@proton/utils/clsx'

export interface ContextMenuButtonProps extends ComponentPropsWithoutRef<'button'> {
  name: string
  icon: IconName | ReactElement<any>
  action: () => void
  close: () => void
}

export function ContextMenuButton({
  name,
  icon,
  action,
  close,
  children,
  ...props
}: PropsWithChildren<ContextMenuButtonProps>) {
  return (
    <DropdownMenuButton
      key={name}
      onContextMenu={(e) => e.stopPropagation()}
      {...props}
      className={clsx('justify-space-between flex flex-nowrap items-center', props.className)}
      onClick={(e) => {
        props.onClick?.(e)
        if (e.defaultPrevented) {
          return
        }
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
