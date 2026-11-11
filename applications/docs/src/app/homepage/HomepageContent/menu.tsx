import * as Ariakit from '@ariakit/react'
import { clsx } from '../utils/clsx'
import { type ReactNode, forwardRef } from 'react'

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
