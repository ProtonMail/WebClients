import DropdownMenuButton from '@proton/components/components/dropdown/DropdownMenuButton'
import type { ComponentPropsWithoutRef, PropsWithChildren, ReactElement } from 'react'

import clsx from '@proton/utils/clsx'

export interface ContextMenuButtonProps extends ComponentPropsWithoutRef<'button'> {
  name: string
  icon: ReactElement<any>
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
        {icon}
        {name}
      </div>
      {children}
    </DropdownMenuButton>
  )
}
