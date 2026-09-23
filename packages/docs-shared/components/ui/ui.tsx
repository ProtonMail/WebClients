import * as Ariakit from '@ariakit/react'
import { forwardRef } from 'react'
import * as Atoms from './atoms'

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

/** `MenuItem` props. Extends `Ariakit.MenuItemProps`. */
export interface MenuItemProps extends Ariakit.MenuItemProps, Atoms.DropdownItemOptions {}
/** Extends `Atoms.DropdownItem` and `Ariakit.MenuItem`. */
export const MenuItem = forwardRef<HTMLDivElement, MenuItemProps>(function MenuItem(props, ref) {
  return <Atoms.DropdownItem ref={ref} {...props} render={<Ariakit.MenuItem render={props.render} />} />
})

// tooltip
// -------

/** `Tooltip` props. Extends `Ariakit.TooltipProps`. */
export interface TooltipProps extends Ariakit.TooltipProps, Atoms.TooltipOptions {}
/** Extends `Atoms.Tooltip` and `Ariakit.Tooltip`. */
export const Tooltip = forwardRef<HTMLDivElement, TooltipProps>(function Tooltip(props, ref) {
  return <Atoms.Tooltip ref={ref} {...props} render={<Ariakit.Tooltip render={props.render} />} />
})
