import * as Ariakit from '@ariakit/react'
import clsx from '@proton/utils/clsx'
import { forwardRef, type ReactNode } from 'react'
import { Icon } from './ui'

// dropdown
// --------

export const DropdownPopover = forwardRef<HTMLDivElement, Ariakit.RoleProps>(function DropdownPopover(props, ref) {
  return (
    <Ariakit.Role
      ref={ref}
      {...props}
      className={clsx(
        'border-weak z-50 max-h-[--popover-available-height] min-w-[10.25rem] overflow-auto overscroll-contain rounded-[.5rem] border bg-[white] py-2 shadow-[0px_8px_24px_0px_rgba(0,0,0,0.16)] focus:outline-none',
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

const DROPDOWN_ITEM_SUBMENU_INDICATOR_ICON = 'chevron-right-filled'
export type DropdownItemOptions = {
  /**
   * Expected to be 16px wide.
   */
  leadingIconSlot?: ReactNode
  /**
   * If `true`, the leading icon slot will default to a checkmark icon, indicating that the item is selected.
   * Overrides `leadingIndent`.
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
}
export interface DropdownItemProps extends Ariakit.RoleProps, DropdownItemOptions {}
export const DropdownItem = forwardRef<HTMLDivElement, DropdownItemProps>(function DropdownItem(
  { leadingIconSlot, selectedIndicator, leadingIndent, trailingIconSlot, submenuIndicator, ...props },
  ref,
) {
  leadingIconSlot =
    leadingIconSlot ??
    (selectedIndicator ? <Icon legacyName="checkmark" className="text-[#0C0C14]" /> : undefined) ??
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
        'flex h-9 select-none items-center gap-2 px-4 text-[.875rem] text-[#0C0C14]',
        // TODO: "hocus" type tw variant
        'hover:bg-[#C2C1C0]/20 focus:outline-none focus-visible:bg-[#C2C1C0]/20 data-[focus-visible]:bg-[#C2C1C0]/20',
        'aria-expanded:bg-[#C2C1C0]/20',
        'active:bg-[#C2C0BE]/35 data-[active]:bg-[#C2C0BE]/35',
        props.className,
      )}
    >
      {leadingIconSlot && <span className="flex shrink-0 items-center">{leadingIconSlot}</span>}
      <span className="flex grow items-center leading-none">{props.children}</span>
      {trailingIconSlot && <span className="flex shrink-0 items-center">{trailingIconSlot}</span>}
    </Ariakit.Role>
  )
})
