import * as Ariakit from '@ariakit/react'
import clsx from '@proton/utils/clsx'
import { type ReactNode, forwardRef } from 'react'
import { Icon } from './ui'

// dropdown
// --------

export const DropdownPopover = forwardRef<HTMLDivElement, Ariakit.RoleProps>(function DropdownPopover(props, ref) {
  return (
    <Ariakit.Role
      ref={ref}
      {...props}
      className={clsx(
        'border-weak z-10 max-h-[--popover-available-height] overflow-auto overscroll-contain rounded-[.5rem] border bg-[white] py-2 shadow-[0px_8px_24px_0px_rgba(0,0,0,0.16)] focus:outline-none',
        props.className,
      )}
    />
  )
})

export const DROPDOWN_POPOVER_DEFAULTS = {
  // TODO: is portal really a good default here?
  portal: true, // TODO: Ariakit might already default to this and the JSDoc of Menu/Select might be wrong
  gutter: 4,
}

/**
 * Expected to be applied on top of `DROPDOWN_POPOVER_DEFAULTS`.
 */
export const DROPDOWN_SUB_POPOVER_DEFAULTS = {
  gutter: 0,
  shift: -9,
}

const DROPDOWN_ITEM_SELECTED_INDICATOR_ICON = 'checkmark'
const DROPDOWN_ITEM_SUBMENU_INDICATOR_ICON = 'chevron-right-filled'
export type DropdownItemOptions = {
  /**
   * Expected to be 16px wide.
   */
  leadingIconSlot?: ReactNode
  /**
   * If `true`, the leading icon slot will default to the selected indicator icon. Overrides `leadingIndent`.
   */
  selectedIndicator?: boolean
  /**
   * If `true`, the leading icon slot will default to empty space resulting in a similar indentation as other
   * items with icons. This is helpful when only some of the items have icons and you want to keep the
   * alignment consistent.
   */
  leadingIndent?: boolean
  /**
   * Expected to be 16px wide.
   */
  trailingIconSlot?: ReactNode
  /**
   * If `true`, the trailing icon slot will default to the submenu indicator icon.
   */
  submenuIndicator?: boolean
  /**
   * Set to `false` to disable the default padding.
   * @default true
   */
  padding?: boolean
}
export interface DropdownItemProps extends Ariakit.RoleProps, DropdownItemOptions {}
export const DropdownItem = forwardRef<HTMLDivElement, DropdownItemProps>(function DropdownItem(
  { leadingIconSlot, selectedIndicator, leadingIndent, trailingIconSlot, submenuIndicator, padding = true, ...props },
  ref,
) {
  leadingIconSlot =
    leadingIconSlot ??
    (selectedIndicator ? (
      <Icon legacyName={DROPDOWN_ITEM_SELECTED_INDICATOR_ICON} className="text-[#0C0C14]" />
    ) : undefined) ??
    (leadingIndent ? <span className="w-4" /> : undefined)

  if (submenuIndicator) {
    trailingIconSlot = trailingIconSlot ?? (
      <Icon legacyName={DROPDOWN_ITEM_SUBMENU_INDICATOR_ICON} className="text-[#0C0C14]" />
    )
  }
  return (
    <Ariakit.Role
      ref={ref}
      {...props}
      className={clsx(
        'flex h-9 select-none items-center gap-2 text-[.875rem] text-[#0C0C14]',
        padding && 'px-4',
        // TODO: "hocus" type tw variant
        'hover:bg-[#C2C1C0]/20 focus:outline-none focus-visible:bg-[#C2C1C0]/20 data-[active-item]:bg-[#C2C1C0]/20 data-[focus-visible]:bg-[#C2C1C0]/20',
        'aria-expanded:bg-[#C2C1C0]/20',
        // TODO: see hack for specificity, otherwise active styles are overridden by data-[focus-visible] :(
        'active:active:bg-[#C2C0BE]/35 data-[active]:bg-[#C2C0BE]/35',
        props.className,
      )}
    >
      {leadingIconSlot && <span className="flex shrink-0 items-center">{leadingIconSlot}</span>}
      <span className="grow leading-none">{props.children}</span>
      {trailingIconSlot && <span className="flex shrink-0 items-center">{trailingIconSlot}</span>}
    </Ariakit.Role>
  )
})

interface DropdownSeparatorProps extends Ariakit.RoleProps {}
export const DropdownSeparator = forwardRef<HTMLHRElement, DropdownSeparatorProps>(
  function DropdownSeparator(props, ref) {
    return (
      <Ariakit.Role ref={ref} {...props} className={clsx('border-weak my-[.4375rem] h-px border-t', props.className)} />
    )
  },
)

export type DropdownGroupOptions = {
  /**
   * If `true`, a separator will be rendered at the bottom of the group.
   */
  bottomSeparator?: boolean
}

export interface DropdownGroupProps extends Ariakit.RoleProps, DropdownGroupOptions {}
export const DropdownGroup = forwardRef<HTMLDivElement, DropdownGroupProps>(function DropdownGroup(
  { bottomSeparator, ...props },
  ref,
) {
  return (
    <Ariakit.Role
      ref={ref}
      {...props}
      className={clsx(bottomSeparator && 'border-weak mb-[.4375rem] border-b pb-[.4375rem]', props.className)}
    />
  )
})

// tooltip
// -------

export type TooltipOptions = {
  /**
   * A slot for trailing content, such as keyboard shortcut hints.
   */
  trailingSlot?: ReactNode
}
export interface TooltipProps extends Ariakit.RoleProps, TooltipOptions {}
export const Tooltip = forwardRef<HTMLDivElement, TooltipProps>(function Tooltip({ trailingSlot, ...props }, ref) {
  return (
    <Ariakit.Role
      ref={ref}
      {...props}
      className={clsx(
        'leading-0 z-20 flex shrink-0 items-center gap-1 rounded-[.5rem] bg-[#0C0C14] px-2 py-[.375rem] text-[.75rem] text-[white] shadow-[0px_-2px_12px_0px_rgba(0,0,0,0.05)]',
        props.className,
      )}
    >
      <span className="grow leading-none">{props.children}</span>
      {trailingSlot && <span className="flex shrink-0 items-center">{trailingSlot}</span>}
    </Ariakit.Role>
  )
})

// kbd (keyboard keys and shortcuts)
// ---------------------------------

export interface KbdProps extends Ariakit.RoleProps<'kbd'> {}
export const Kbd = forwardRef<HTMLDivElement, KbdProps>(function Kbd(props, ref) {
  return (
    <Ariakit.Role
      ref={ref}
      render={<kbd />}
      {...props}
      className={clsx(
        "flex h-[1.125rem] shrink-0 justify-center rounded-[.25rem] bg-[#25283A] px-1 py-[.0625rem] font-['Monaco',monospace] text-[.75rem] leading-[1rem] text-[white]",
        props.className,
      )}
    >
      <span className="shrink-0">{props.children}</span>
    </Ariakit.Role>
  )
})

export interface KbdShortcutProps extends Ariakit.RoleProps {}
export const KbdShortcut = forwardRef<HTMLDivElement, KbdShortcutProps>(function KbdShortcut(props, ref) {
  return (
    <Ariakit.Role ref={ref} {...props} className={clsx('flex shrink-0 items-center gap-[.125rem]', props.className)} />
  )
})
