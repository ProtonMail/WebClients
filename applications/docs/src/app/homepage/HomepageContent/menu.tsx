import * as Ariakit from '@ariakit/react'
import { clsx } from '../utils/clsx'
import { type KeyboardEvent, type ReactNode, forwardRef } from 'react'

export interface MenuProps extends Ariakit.MenuProps {
  /** @default true */
  portal?: Ariakit.MenuProps['portal']
  /** @default 4 */
  gutter?: Ariakit.MenuProps['gutter']
}

const MENU_DEFAULTS = { portal: true, gutter: 4 }

export const Menu = forwardRef<HTMLDivElement, MenuProps>(function Menu(props, ref) {
  return (
    <Ariakit.Role
      ref={ref}
      {...MENU_DEFAULTS}
      {...props}
      className={clsx(
        'border-weak z-10 max-h-[--popover-available-height] max-w-[--popover-available-width] overflow-auto overscroll-contain rounded-[.5rem] border bg-[--background-norm] py-2 text-[--text-norm] shadow-[0px_8px_24px_0px_rgba(0,0,0,0.16)] focus:outline-none',
        props.className,
      )}
      render={<Ariakit.Menu render={props.render} />}
    />
  )
})

export interface MenuItemProps extends Ariakit.MenuItemProps {
  /** Expected to be 16px wide. */
  leadingIconSlot?: ReactNode
}

export const MenuItem = forwardRef<HTMLDivElement, MenuItemProps>(function MenuItem(
  { leadingIconSlot, ...props },
  ref,
) {
  return (
    <Ariakit.Role
      ref={ref}
      {...props}
      className={clsx(
        'flex select-none flex-nowrap items-start gap-2 px-4 py-[.4375rem] text-[.875rem] text-[--text-norm]',
        'disabled:text-[--text-hint] aria-disabled:text-[--text-hint]',
        'hover:bg-[--interaction-weak-minor-2] focus:outline-none focus-visible:bg-[--interaction-weak-minor-2] data-[active-item]:bg-[--interaction-weak-minor-2] data-[focus-visible]:bg-[--interaction-weak-minor-2]',
        'aria-expanded:bg-[--interaction-weak-minor-2]',
        '[[data-theme-mode=dark]_&]:hover:!bg-[--interaction-weak-minor-1] [[data-theme-mode=dark]_&]:focus-visible:!bg-[--interaction-weak-minor-1] [[data-theme-mode=dark]_&]:aria-expanded:!bg-[--interaction-weak-minor-1] [[data-theme-mode=dark]_&]:data-[active-item]:!bg-[--interaction-weak-minor-1] [[data-theme-mode=dark]_&]:data-[focus-visible]:!bg-[--interaction-weak-minor-1]',
        // The doubled `active:` raises specificity, otherwise data-[focus-visible] overrides the active styles.
        'active:active:bg-[--interaction-weak-minor-1] data-[active]:bg-[--interaction-weak-minor-1]',
        '[[data-theme-mode=dark]_&]:active:!bg-[--interaction-weak] [[data-theme-mode=dark]_&]:data-[active]:!bg-[--interaction-weak]',
        props.className,
      )}
      render={<Ariakit.MenuItem render={props.render} />}
    >
      {leadingIconSlot && <span className="flex h-[1.375rem] shrink-0 items-center">{leadingIconSlot}</span>}
      <span className="grow leading-[1.375rem]">{props.children}</span>
    </Ariakit.Role>
  )
})

// Proton's `transform-origins` mixin (packages/styles/scss/lib/_transform-origins.scss): the dropdown scales from
// the corner or side next to its anchor.
const DROPDOWN_ORIGIN_BY_PLACEMENT: Record<Ariakit.MenuStoreState['currentPlacement'], string> = {
  top: 'bottom center',
  'top-start': 'bottom left',
  'top-end': 'bottom right',
  bottom: 'top center',
  'bottom-start': 'top left',
  'bottom-end': 'top right',
  left: 'right center',
  'left-start': 'right top',
  'left-end': 'right bottom',
  right: 'left center',
  'right-start': 'left top',
  'right-end': 'left bottom',
}

export type DropdownMenuProps = MenuProps

/**
 * Proton's dropdown on `Menu`: 10em wide inside its 1px border, 3px above and below the items, scaling from 75% and
 * fading over 0.15s from the side of its anchor, and its keys. Render it in an `Ariakit.MenuProvider`.
 */
export const DropdownMenu = forwardRef<HTMLDivElement, DropdownMenuProps>(function DropdownMenu(
  { className, style, onKeyDownCapture, ...props },
  ref,
) {
  const menu = Ariakit.useMenuContext()
  const placement = Ariakit.useStoreState(menu, 'currentPlacement')
  return (
    <Menu
      ref={ref}
      typeahead={false}
      modal={false}
      unmountOnHide
      // Proton's popper flips and shifts the dropdown right up to the viewport's edge.
      overflowPadding={0}
      {...props}
      onKeyDownCapture={(event) => {
        onKeyDownCapture?.(event)
        if (menu) {
          handleDropdownKeys(event, menu)
        }
      }}
      style={{ transformOrigin: placement && DROPDOWN_ORIGIN_BY_PLACEMENT[placement], ...style }}
      className={clsx(
        'min-w-[calc(10em+2px)] !border-[--border-norm] !py-[.1875rem]',
        'scale-75 opacity-[0] data-[enter]:scale-100 data-[enter]:opacity-100',
        '[transition:transform_0.15s_cubic-bezier(0.33,1,0.68,1),opacity_0.15s_cubic-bezier(0.33,1,0.68,1)]',
        className,
      )}
    />
  )
})

// The keys of Proton's dropdown, whose hotkeys read Cmd as Ctrl off macOS.
function handleDropdownKeys(event: KeyboardEvent<HTMLDivElement>, menu: Ariakit.MenuStore) {
  const isArrow = event.key === 'ArrowUp' || event.key === 'ArrowDown'
  if (isArrow && (event.metaKey || event.ctrlKey || event.altKey || event.shiftKey)) {
    event.preventDefault()
    const jumpsToEnd = isMac() ? event.metaKey && !event.ctrlKey : event.ctrlKey && !event.metaKey
    if (jumpsToEnd && !event.altKey && !event.shiftKey) {
      menu.move(event.key === 'ArrowUp' ? menu.first() : menu.last())
    }
  } else if (event.key === 'Tab') {
    event.preventDefault()
    const isMenuFocused = event.target === event.currentTarget
    if (event.shiftKey) {
      menu.move(isMenuFocused ? menu.last() : menu.previous())
    } else {
      menu.move(isMenuFocused ? menu.first() : menu.next())
    }
  } else if (['Home', 'End', 'PageUp', 'PageDown'].includes(event.key)) {
    event.preventDefault()
  }
}

/** As Proton's `isMac` (packages/shared/lib/helpers/browser.ts), which ua-parser-js reads from the user agent. */
function isMac() {
  const { userAgent } = navigator
  return /Macintosh|Mac OS X/.test(userAgent) && !/iPhone|iPad|iPod/.test(userAgent)
}

export type DropdownMenuItemProps = Omit<Ariakit.MenuItemProps, 'className'>

/** Proton's `DropdownMenuButton`: its hover, pressed and disabled looks, and its focus ring drawn 3px inside the item. */
export function DropdownMenuItem(props: DropdownMenuItemProps) {
  return (
    <Ariakit.MenuItem
      // Proton's dropdown only highlights the hovered item.
      focusOnHover={false}
      {...props}
      className={clsx(
        'relative z-[1] flex w-full cursor-pointer select-none items-center gap-2 px-4 py-2 text-left text-[.875rem] leading-5 text-[--text-norm] [outline:none]',
        'bg-[--interaction-default] hover:bg-[--interaction-default-hover] active:bg-[--interaction-default-active]',
        'disabled:pointer-events-none disabled:opacity-[.5]',
        '[transition:0.15s_cubic-bezier(0.22,1,0.36,1),background-position_0s]',
        "after:pointer-events-none after:absolute after:inset-[.1875rem] after:z-[2] after:rounded-[--border-radius-sm] after:border after:border-solid after:border-[transparent] after:content-[''] after:[transition:0.15s_cubic-bezier(0.5,1,0.89,1)]",
        'data-[focus-visible]:after:border-[--focus-outline] data-[focus-visible]:after:shadow-[0_0_0_.1875rem_var(--focus-ring)]',
        'data-[focus-visible]:hover:bg-[transparent] data-[focus-visible]:hover:after:bg-[--interaction-default-hover] data-[focus-visible]:active:bg-[transparent]',
      )}
    />
  )
}

export type DropdownMenuSeparatorProps = Omit<Ariakit.MenuSeparatorProps, 'className'>

/** Proton's `ContextSeparator`. */
export function DropdownMenuSeparator(props: DropdownMenuSeparatorProps) {
  return <Ariakit.MenuSeparator {...props} className="m-0 my-1" />
}
