import * as Ariakit from '@ariakit/react'
import type { IconName } from '@proton/components'
import clsx from '@proton/utils/clsx'
import type { ReactElement } from 'react'
import { type ComponentPropsWithoutRef, forwardRef, isValidElement } from 'react'
import { Icon as LegacyIcon } from '@proton/components'
import * as Atoms from './atoms'

// icon
// ----

export type IconData = string | ReactElement
export type IconOptions = {
  data?: IconData
  /** @deprecated Use `data` instead. */
  legacyName?: IconName
}
export interface IconProps extends ComponentPropsWithoutRef<'svg'>, IconOptions {}
export const Icon = forwardRef<SVGSVGElement, IconProps>(function Icon({ legacyName, data, ...props }: IconProps, ref) {
  if (legacyName) {
    return (
      <LegacyIcon ref={ref} {...props} name={legacyName} rotate={props.rotate ? Number(props.rotate) : undefined} />
    )
  }
  if (!data) {
    throw new Error('Icon component: either `data` or `legacyName` must be provided')
  }
  let content
  if (typeof data === 'string') {
    content = <path fill="currentColor" d={data} />
  } else if (isValidElement(data)) {
    content = data
  } else {
    throw new Error('Icon component: `data` must be a string or a valid ReactElement with SVG content')
  }
  return (
    // TODO: if extracted into a CSS layer, no need for :where, probably
    <svg ref={ref} viewBox="0 0 16 16" {...props} className="[:where(&)]:h-4 [:where(&)]:w-4">
      {content}
    </svg>
  )
})

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
      {...Atoms.DROPDOWN_POPOVER_DEFAULTS}
      {...props}
      render={<Atoms.DropdownPopover render={props.render} />}
    />
  )
})

export interface SubMenuProps extends MenuProps {
  /** @default 0 */
  gutter?: MenuProps['gutter']
  /** @default -9 */
  shift?: MenuProps['shift']
}
export const SubMenu = forwardRef<HTMLDivElement, SubMenuProps>(function SubMenu(props, ref) {
  return <Menu ref={ref} {...Atoms.DROPDOWN_SUB_POPOVER_DEFAULTS} {...props} />
})

export interface MenuItemOptions extends Atoms.DropdownItemOptions {}
export interface MenuItemProps extends Ariakit.MenuItemProps, MenuItemOptions {}
export const MenuItem = forwardRef<HTMLDivElement, MenuItemProps>(function MenuItem(props, ref) {
  return <Ariakit.MenuItem ref={ref} {...props} render={<Atoms.DropdownItem render={props.render} />} />
})

export interface SubMenuButtonProps extends Ariakit.MenuButtonProps, MenuItemOptions {
  menuItemProps?: MenuItemProps
}
export const SubMenuButton = forwardRef<HTMLButtonElement, SubMenuButtonProps>(function SubMenuButton(
  { menuItemProps, ...props },
  ref,
) {
  return <Ariakit.MenuButton ref={ref} submenuIndicator render={<MenuItem {...menuItemProps} />} {...props} />
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

export interface MenuItemCheckboxOptions extends Atoms.DropdownItemOptions {}
export interface MenuItemCheckboxProps extends Ariakit.MenuItemCheckboxProps, MenuItemCheckboxOptions {}
export const MenuItemCheckbox = forwardRef<HTMLDivElement, MenuItemCheckboxProps>(
  function MenuItemCheckbox(props, ref) {
    const menu = Ariakit.useMenuContext()
    const isChecked = Ariakit.useStoreState(menu, (state) => {
      const group = state?.values[props.name]
      return Array.isArray(group) && group.includes(props.value as any)
    })
    return (
      <Ariakit.MenuItemCheckbox
        ref={ref}
        leadingIndent
        selectedIndicator={isChecked}
        {...props}
        render={<Atoms.DropdownItem render={props.render} />}
      />
    )
  },
)

export interface MenuItemRadioOptions extends Atoms.DropdownItemOptions {}
export interface MenuItemRadioProps extends Ariakit.MenuItemRadioProps, MenuItemRadioOptions {}
export const MenuItemRadio = forwardRef<HTMLDivElement, MenuItemRadioProps>(function MenuItemRadio(props, ref) {
  const menu = Ariakit.useMenuContext()
  const isChecked = Ariakit.useStoreState(menu, (state) => state?.values[props.name] === props.value)
  return (
    <Ariakit.MenuItemRadio
      ref={ref}
      leadingIndent
      selectedIndicator={isChecked}
      {...props}
      render={<Atoms.DropdownItem render={props.render} />}
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
      {...Atoms.DROPDOWN_POPOVER_DEFAULTS}
      {...props}
      render={<Atoms.DropdownPopover render={props.render} />}
    />
  )
})

export interface SelectItemOptions extends Atoms.DropdownItemOptions {}
export interface SelectItemProps extends Ariakit.SelectItemProps, SelectItemOptions {}
export const SelectItem = forwardRef<HTMLDivElement, SelectItemProps>(function SelectItem(props, ref) {
  const select = Ariakit.useSelectContext()
  const isChecked = Ariakit.useStoreState(select, (state) => state?.value === props.value)
  return (
    <Ariakit.SelectItem
      ref={ref}
      leadingIndent
      selectedIndicator={isChecked}
      {...props}
      render={<Atoms.DropdownItem render={props.render} />}
    />
  )
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

// combobox

import type { ComboboxProviderProps } from '@ariakit/react'
export type { ComboboxProviderProps }
export const ComboboxProvider = Ariakit.ComboboxProvider

import type { ComboboxProps } from '@ariakit/react'
export type { ComboboxProps }
export const Combobox = Ariakit.Combobox

export interface ComboboxPopoverProps extends Ariakit.ComboboxPopoverProps {}
export const ComboboxPopover = forwardRef<HTMLDivElement, ComboboxPopoverProps>(function ComboboxPopover(props, ref) {
  return (
    <Ariakit.ComboboxPopover
      ref={ref}
      {...Atoms.DROPDOWN_POPOVER_DEFAULTS}
      {...props}
      render={<Atoms.DropdownPopover render={props.render} />}
    />
  )
})

export interface ComboboxItemOptions extends Atoms.DropdownItemOptions {}
export interface ComboboxItemProps extends Ariakit.ComboboxItemProps, ComboboxItemOptions {}
export const ComboboxItem = forwardRef<HTMLDivElement, ComboboxItemProps>(function ComboboxItem(props, ref) {
  return <Ariakit.ComboboxItem ref={ref} {...props} render={<Atoms.DropdownItem render={props.render} />} />
})
