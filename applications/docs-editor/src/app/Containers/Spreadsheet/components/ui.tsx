import * as Ariakit from '@ariakit/react'
import type { IconName } from '@proton/components'
import { Icon as LegacyIcon } from '@proton/components'
import type { ReactElement } from 'react'
import { type ComponentPropsWithoutRef, forwardRef, isValidElement } from 'react'
import * as Atoms from './atoms'

// icon
// ----

/**
 * Represents the data for an icon, which can be one of the following:
 * - A string representing the SVG path data.
 * - A React element containing SVG contents. It can be a React fragment to include multiple SVG child elements.
 */
export type IconData = string | ReactElement
/** `Icon` options. */
export type IconOptions = {
  /**
   * The icon's data, which can be one of the following:
   * - A string representing the SVG path data.
   * - A React element containing SVG contents. It can be a React fragment to include multiple SVG child elements.
   */
  data?: IconData
  /**
   * If provided, the icon will be rendered using the `Icon` component from `@proton/components`.
   * @deprecated Use `data` instead.
   */
  legacyName?: IconName
}
/** `Icon` props. */
export interface IconProps extends ComponentPropsWithoutRef<'svg'>, IconOptions {}
/**
 * Renders an icon as an SVG element.
 *
 * The icon's data, provided through the `data` prop, can be one of the following:
 * - A string representing the SVG path data.
 * - A React element containing SVG contents. It can be a React fragment to include multiple SVG child elements.
 *
 * Legacy icons (referenced by their name) can be used by providing the `legacyName` prop.
 * This will render the icon using the `Icon` component from `@proton/components`.
 */
export const Icon = forwardRef<SVGSVGElement, IconProps>(function Icon({ legacyName, data, ...props }: IconProps, ref) {
  if (legacyName) {
    return (
      <LegacyIcon ref={ref} {...props} name={legacyName} rotate={props.rotate ? Number(props.rotate) : undefined} />
    )
  }
  if (!data) {
    throw new Error('Icon component: either `data` or `legacyName` must be provided')
  }
  let content: ReactElement
  if (typeof data === 'string') {
    content = <path fill="currentColor" d={data} />
  } else if (isValidElement(data)) {
    content = data
  } else {
    throw new Error('Icon component: `data` must be a string or a valid ReactElement with SVG content')
  }
  return (
    // TODO: if extracted into a CSS layer, no need for :where, probably
    // biome-ignore lint/a11y/noSvgWithoutTitle: visual icons only.
    <svg ref={ref} viewBox="0 0 16 16" {...props} className="[:where(&)]:h-4 [:where(&)]:w-4">
      {content}
    </svg>
  )
})

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
