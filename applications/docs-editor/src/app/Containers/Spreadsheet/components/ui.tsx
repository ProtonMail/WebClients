import * as Ariakit from '@ariakit/react'
import type { IconName } from '@proton/components'
import { Icon } from '@proton/components'
import clsx from '@proton/utils/clsx'
import { forwardRef } from 'react'

const SELECT_AND_MENU_ITEM_CLASSES =
  'flex h-9 select-none items-center px-4 text-[.875rem] text-[#0C0C14] hover:bg-[#C2C1C0]/20'
const SELECT_AND_MENU_POPOVER_CLASSES =
  'border-weak z-50 max-h-[--popover-available-height] min-w-[10.25rem] overflow-auto overscroll-contain rounded-[.5rem] border bg-[white] py-2 shadow-[0px_8px_24px_0px_rgba(0,0,0,0.16)]'
const SELECT_AND_POPOVER_GUTTER = 4

// menu
// ----

import type { MenuProviderProps } from '@ariakit/react'
export type { MenuProviderProps }
export const MenuProvider = Ariakit.MenuProvider

import type { MenuButtonProps } from '@ariakit/react'
export type { MenuButtonProps }
export const MenuButton = Ariakit.MenuButton

export interface MenuProps extends Ariakit.MenuProps {
  /** @default true */
  portal?: Ariakit.MenuProps['portal']
  /** @default 4 */
  gutter?: Ariakit.MenuProps['gutter']
}
export const Menu = forwardRef<HTMLDivElement, MenuProps>(function Menu(props, ref) {
  return (
    <Ariakit.Menu
      ref={ref}
      portal // TODO: Ariakit JSDoc might be wrong
      gutter={SELECT_AND_POPOVER_GUTTER}
      {...props}
      className={clsx(SELECT_AND_MENU_POPOVER_CLASSES, props.className)}
    />
  )
})

export interface MenuItemProps extends Ariakit.MenuItemProps {
  isSubmenuTrigger?: boolean
  icon?: IconName
}
export const MenuItem = forwardRef<HTMLDivElement, MenuItemProps>(function MenuItem(
  { isSubmenuTrigger, children, icon, ...props },
  ref,
) {
  return (
    <Ariakit.MenuItem ref={ref} {...props} className={clsx(SELECT_AND_MENU_ITEM_CLASSES, props.className)}>
      <span className="grow">{children}</span>
      {isSubmenuTrigger && <Icon name="chevron-right-filled" className="text-[#0C0C14]" />}
    </Ariakit.MenuItem>
  )
})

export interface MenuSeparatorProps extends Ariakit.MenuSeparatorProps {}
export const MenuSeparator = forwardRef<HTMLHRElement, MenuSeparatorProps>(function MenuSeparator(props, ref) {
  return (
    <Ariakit.MenuSeparator
      ref={ref}
      {...props}
      className={clsx('border-weak my-[.4375rem] h-px border-t', props.className)}
    />
  )
})

// select
// ------

import type { SelectProviderProps } from '@ariakit/react'
export type { SelectProviderProps }
export const SelectProvider = Ariakit.SelectProvider

import type { SelectProps } from '@ariakit/react'
export type { SelectProps }
export const Select = Ariakit.Select

export interface SelectPopoverProps extends Ariakit.SelectPopoverProps {
  /** @default true */
  portal?: Ariakit.SelectPopoverProps['portal']
  /** @default 4 */
  gutter?: Ariakit.SelectPopoverProps['gutter']
}
export const SelectPopover = forwardRef<HTMLDivElement, SelectPopoverProps>(function SelectPopover(props, ref) {
  return (
    <Ariakit.SelectPopover
      ref={ref}
      portal // TODO: Ariakit JSDoc might be wrong
      gutter={SELECT_AND_POPOVER_GUTTER}
      {...props}
      className={clsx(SELECT_AND_MENU_POPOVER_CLASSES, props.className)}
    />
  )
})

export interface SelectItemProps extends Ariakit.SelectItemProps {}
export const SelectItem = forwardRef<HTMLDivElement, SelectItemProps>(function SelectItem(props, ref) {
  return <Ariakit.SelectItem ref={ref} {...props} className={clsx(SELECT_AND_MENU_ITEM_CLASSES, props.className)} />
})

export interface SelectGroupProps extends Ariakit.SelectGroupProps {
  bottomSeparator?: boolean
}

export const SelectGroup = forwardRef<HTMLDivElement, SelectGroupProps>(function SelectGroup(
  { bottomSeparator, ...props }: SelectGroupProps,
  ref,
) {
  return (
    <Ariakit.SelectGroup
      ref={ref}
      {...props}
      className={clsx(bottomSeparator && 'border-weak mb-[.4375rem] border-b pb-[.4375rem]', props.className)}
    />
  )
})

// TODO:
// - menu item icons
// - submenu trigger active style
// - menu item checkbox/radio
// - select checkmark
