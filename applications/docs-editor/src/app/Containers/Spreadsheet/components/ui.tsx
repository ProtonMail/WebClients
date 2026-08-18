import * as Ariakit from '@ariakit/react'
import { forwardRef } from 'react'
import * as Atoms from './atoms'
export type { IconData, IconOptions, IconProps } from './Icon'
export { Icon } from './Icon'

// menu
// ----

/** `Menu` props. Extends `Ariakit.MenuProps`. */
export interface MenuProps extends Ariakit.MenuProps {
  /** @default true */
  portal?: Ariakit.MenuProps['portal']
  /** @default 4 */
  gutter?: Ariakit.MenuProps['gutter']
}
/** Extends `Atoms.DropdownPopover` and `Ariakit.Menu`. */
export const Menu = forwardRef<HTMLDivElement, MenuProps>(function Menu(props, ref) {
  return (
    <Atoms.DropdownPopover
      ref={ref}
      {...Atoms.DROPDOWN_POPOVER_DEFAULTS}
      {...props}
      render={<Ariakit.Menu render={props.render} />}
    />
  )
})

/** `SubMenu` props. Extends `MenuProps`. */
export interface SubMenuProps extends MenuProps {
  /** @default 0 */
  gutter?: MenuProps['gutter']
  /** @default -9 */
  shift?: MenuProps['shift']
}
/** Extends `Menu`. */
export const SubMenu = forwardRef<HTMLDivElement, SubMenuProps>(function SubMenu(props, ref) {
  return <Menu ref={ref} {...Atoms.DROPDOWN_SUB_POPOVER_DEFAULTS} {...props} />
})

/** `MenuItem` options. Extends `Atoms.DropdownItemOptions`. */
export interface MenuItemOptions extends Atoms.DropdownItemOptions {}
/** `MenuItem` props. Extends `Ariakit.MenuItemProps`. */
export interface MenuItemProps extends Ariakit.MenuItemProps, MenuItemOptions {}
/** Extends `Atoms.DropdownItem` and `Ariakit.MenuItem`. */
export const MenuItem = forwardRef<HTMLDivElement, MenuItemProps>(function MenuItem(props, ref) {
  return <Atoms.DropdownItem ref={ref} {...props} render={<Ariakit.MenuItem render={props.render} />} />
})

/** `SubMenuButton` props. Extends `Ariakit.MenuButtonProps`. */
export interface SubMenuButtonProps extends Ariakit.MenuButtonProps, MenuItemOptions {
  menuItemProps?: MenuItemProps
}
/** Extends `Ariakit.MenuButton` and `MenuItem`. */
export const SubMenuButton = forwardRef<HTMLButtonElement, SubMenuButtonProps>(function SubMenuButton(
  { menuItemProps, ...props },
  ref,
) {
  return <Ariakit.MenuButton ref={ref} submenuIndicator render={<MenuItem {...menuItemProps} />} {...props} />
})

/** `MenuSeparator` props. Extends `Ariakit.MenuSeparatorProps`. */
export interface MenuSeparatorProps extends Ariakit.MenuSeparatorProps {}
/** Extends `Atoms.DropdownSeparator` and `Ariakit.MenuSeparator`. */
export const MenuSeparator = forwardRef<HTMLHRElement, MenuSeparatorProps>(function MenuSeparator(props, ref) {
  return <Atoms.DropdownSeparator ref={ref} {...props} render={<Ariakit.MenuSeparator render={props.render} />} />
})

/** `MenuItemCheckbox` options. Extends `Atoms.DropdownItemOptions`. */
export interface MenuItemCheckboxOptions extends Atoms.DropdownItemOptions {}
/** `MenuItemCheckbox` props. Extends `Ariakit.MenuItemCheckboxProps`. */
export interface MenuItemCheckboxProps extends Ariakit.MenuItemCheckboxProps, MenuItemCheckboxOptions {}
/** Extends `Atoms.DropdownItem` and `Ariakit.MenuItemCheckbox`. */
export const MenuItemCheckbox = forwardRef<HTMLDivElement, MenuItemCheckboxProps>(
  function MenuItemCheckbox(props, ref) {
    const menu = Ariakit.useMenuContext()
    const isChecked = Ariakit.useStoreState(menu, (state) => {
      const group = state?.values[props.name]
      // biome-ignore lint/suspicious/noExplicitAny: it's fine.
      return Array.isArray(group) && group.includes(props.value as any)
    })
    return (
      <Atoms.DropdownItem
        ref={ref}
        leadingIndent
        selectedIndicator={isChecked}
        {...props}
        /** @ts-expect-error The `name` prop is passed through the render prop. */
        render={<Ariakit.MenuItemCheckbox render={props.render} />}
      />
    )
  },
)

/** `MenuItemRadio` options. Extends `Atoms.DropdownItemOptions`. */
export interface MenuItemRadioOptions extends Atoms.DropdownItemOptions {}
/** `MenuItemRadio` props. Extends `Ariakit.MenuItemRadioProps`. */
export interface MenuItemRadioProps extends Ariakit.MenuItemRadioProps, MenuItemRadioOptions {}
/** Extends `Atoms.DropdownItem` and `Ariakit.MenuItemRadio`. */
export const MenuItemRadio = forwardRef<HTMLDivElement, MenuItemRadioProps>(function MenuItemRadio(props, ref) {
  const menu = Ariakit.useMenuContext()
  const isChecked = Ariakit.useStoreState(menu, (state) => state?.values[props.name] === props.value)
  return (
    <Atoms.DropdownItem
      ref={ref}
      leadingIndent
      selectedIndicator={isChecked}
      {...props}
      // @ts-expect-error The `name` and `values` props are passed through the render prop.
      render={<Ariakit.MenuItemRadio render={props.render} />}
    />
  )
})

/** `MenuGroup` options. Extends `Atoms.DropdownGroupOptions`. */
export interface MenuGroupOptions extends Atoms.DropdownGroupOptions {}
/** `MenuGroup` props. Extends `Ariakit.MenuGroupProps`. */
export interface MenuGroupProps extends Ariakit.MenuGroupProps, MenuGroupOptions {}
/** Extends `Atoms.DropdownGroup` and `Ariakit.MenuGroup`. */
export const MenuGroup = forwardRef<HTMLDivElement, MenuGroupProps>(function MenuGroup(props: MenuGroupProps, ref) {
  return <Atoms.DropdownGroup ref={ref} {...props} render={<Ariakit.MenuGroup render={props.render} />} />
})

/** `MenuGroupLabel` options. Extends `Ariakit.MenuGroupLabelOptions`. */
export interface MenuGroupLabelOptions extends Ariakit.MenuGroupLabelOptions {}
/** `MenuGroupLabel` props. Extends `Ariakit.MenuGroupLabelProps`. */
export interface MenuGroupLabelProps extends Ariakit.MenuGroupLabelProps {}
/** Extends `Ariakit.MenuGroupLabel`. */
export const MenuGroupLabel = forwardRef<HTMLDivElement, MenuGroupLabelProps>(function MenuGroupLabel(props, ref) {
  return <Atoms.DropdownGroupLabel ref={ref} {...props} render={<Ariakit.MenuGroupLabel render={props.render} />} />
})

// select
// ------

/** `SelectPopover` props. Extends `Ariakit.SelectPopoverProps`. */
export interface SelectPopoverProps extends Ariakit.SelectPopoverProps {
  /** @default true */
  portal?: Ariakit.SelectPopoverProps['portal']
  /** @default 4 */
  gutter?: Ariakit.SelectPopoverProps['gutter']
}
/** Extends `Atoms.DropdownPopover` and `Ariakit.SelectPopover`. */
export const SelectPopover = forwardRef<HTMLDivElement, SelectPopoverProps>(function SelectPopover(props, ref) {
  return (
    <Atoms.DropdownPopover
      ref={ref}
      {...Atoms.DROPDOWN_POPOVER_DEFAULTS}
      {...props}
      render={<Ariakit.SelectPopover render={props.render} />}
    />
  )
})

/** `SelectItem` options. Extends `Atoms.DropdownItemOptions`. */
export interface SelectItemOptions extends Atoms.DropdownItemOptions {}
/** `SelectItem` props. Extends `Ariakit.SelectItemProps`. */
export interface SelectItemProps extends Ariakit.SelectItemProps, SelectItemOptions {}
/** Extends `Atoms.DropdownItem` and `Ariakit.SelectItem`. */
export const SelectItem = forwardRef<HTMLDivElement, SelectItemProps>(function SelectItem(props, ref) {
  const select = Ariakit.useSelectContext()
  const isChecked = Ariakit.useStoreState(select, (state) => state?.value === props.value)
  return (
    <Atoms.DropdownItem
      ref={ref}
      leadingIndent
      selectedIndicator={isChecked}
      {...props}
      render={<Ariakit.SelectItem render={props.render} />}
    />
  )
})

/** `SelectGroup` options. Extends `Atoms.DropdownGroupOptions`. */
export interface SelectGroupOptions extends Atoms.DropdownGroupOptions {}
/** `SelectGroup` props. Extends `Ariakit.SelectGroupProps`. */
export interface SelectGroupProps extends Ariakit.SelectGroupProps, SelectGroupOptions {}
/** Extends `Atoms.DropdownGroup` and `Ariakit.SelectGroup`. */
export const SelectGroup = forwardRef<HTMLDivElement, SelectGroupProps>(function SelectGroup(
  props: SelectGroupProps,
  ref,
) {
  return <Atoms.DropdownGroup ref={ref} {...props} render={<Ariakit.SelectGroup render={props.render} />} />
})

// combobox
// --------

/** `ComboboxPopover` props. Extends `Ariakit.ComboboxPopoverProps`. */
export interface ComboboxPopoverProps extends Ariakit.ComboboxPopoverProps {}
/** Extends `Atoms.DropdownPopover` and `Ariakit.ComboboxPopover`. */
export const ComboboxPopover = forwardRef<HTMLDivElement, ComboboxPopoverProps>(function ComboboxPopover(props, ref) {
  return (
    <Atoms.DropdownPopover
      ref={ref}
      {...Atoms.DROPDOWN_POPOVER_DEFAULTS}
      {...props}
      render={<Ariakit.ComboboxPopover render={props.render} />}
    />
  )
})

/** `ComboboxItem` options. Extends `Atoms.DropdownItemOptions`. */
export interface ComboboxItemOptions extends Atoms.DropdownItemOptions {}
/** `ComboboxItem` props. Extends `Ariakit.ComboboxItemProps`. */
export interface ComboboxItemProps extends Ariakit.ComboboxItemProps, ComboboxItemOptions {}
/** Extends `Atoms.DropdownItem` and `Ariakit.ComboboxItem`. */
export const ComboboxItem = forwardRef<HTMLDivElement, ComboboxItemProps>(function ComboboxItem(props, ref) {
  return <Atoms.DropdownItem ref={ref} {...props} render={<Ariakit.ComboboxItem render={props.render} />} />
})

// tooltip
// -------

/** `Tooltip` options. Extends `Atoms.TooltipOptions`. */
export interface TooltipOptions extends Atoms.TooltipOptions {}
/** `Tooltip` props. Extends `Ariakit.TooltipProps`. */
export interface TooltipProps extends Ariakit.TooltipProps, TooltipOptions {}
/** Extends `Atoms.Tooltip` and `Ariakit.Tooltip`. */
export const Tooltip = forwardRef<HTMLDivElement, TooltipProps>(function Tooltip(props, ref) {
  return <Atoms.Tooltip ref={ref} {...props} render={<Ariakit.Tooltip render={props.render} />} />
})
