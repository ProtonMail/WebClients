import { forwardRef } from 'react'
import * as Ariakit from '@ariakit/react'
import clsx from '@proton/utils/clsx'

export type MenubarItemProps = Ariakit.MenuItemProps

export const MenubarItem = forwardRef<HTMLDivElement, MenubarItemProps>(function MenubarItem(props, ref) {
  return (
    <Ariakit.MenuItem
      ref={ref}
      {...props}
      className={clsx(
        'flex h-5 select-none items-center rounded-[.25rem] px-[.375rem] text-[.75rem] text-[#5C5958] hover:bg-[#c2c1c0]/20 focus:outline-none active:!bg-[#c2c0be]/35 aria-expanded:!bg-[#c2c0be]/35 data-[focus-visible]:bg-[#c2c1c0]/20',
        props.className,
      )}
    />
  )
})
