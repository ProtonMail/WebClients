import { forwardRef } from 'react'
import * as Ariakit from '@ariakit/react'
import { clsx } from 'clsx'

export type MenubarItemProps = Ariakit.MenuItemProps

export const MenubarItem = forwardRef<HTMLDivElement, MenubarItemProps>(function MenubarItem(props, ref) {
  return (
    <Ariakit.MenuItem
      ref={ref}
      {...props}
      className={clsx(
        'flex h-5 select-none items-center rounded-[.25rem] px-[.375rem] text-[.75rem] text-[--text-weak] hover:bg-[--interaction-weak-minor-2] focus:outline-none active:!bg-[--interaction-weak-minor-1] aria-expanded:!bg-[--interaction-weak-minor-1] data-[focus-visible]:bg-[--interaction-weak-minor-2] [[data-theme-mode=dark]_&]:hover:!bg-[--interaction-weak-minor-1] [[data-theme-mode=dark]_&]:focus-visible:!bg-[--interaction-weak-minor-1] [[data-theme-mode=dark]_&]:aria-expanded:!bg-[--interaction-weak-minor-1] [[data-theme-mode=dark]_&]:data-[focus-visible]:!bg-[--interaction-weak-minor-1]',
        props.className,
      )}
    />
  )
})
