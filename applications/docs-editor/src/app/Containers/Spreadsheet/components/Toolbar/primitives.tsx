import * as Ariakit from '@ariakit/react'
import type { IconName } from '@proton/icons'
import clsx from '@proton/utils/clsx'
import { type ComponentPropsWithoutRef, type ReactNode, forwardRef } from 'react'
import { Icon, type IconData } from '../ui'
import * as UI from '../ui'

export interface ContainerProps extends ComponentPropsWithoutRef<'div'> {
  formulaBarSlot?: ReactNode
}

export const Container = forwardRef<HTMLDivElement, ContainerProps>(function Container(
  { formulaBarSlot, ...props }: ContainerProps,
  ref,
) {
  return (
    <div ref={ref} {...props} className={clsx('px-4 pb-3', props.className)}>
      <Ariakit.Toolbar className="border-weak flex items-center gap-[.125rem] rounded-t-[1rem] border bg-[white] px-3 py-[.375rem]">
        {props.children}
      </Ariakit.Toolbar>
      {formulaBarSlot}
    </div>
  )
})

export interface ItemProps extends Ariakit.ToolbarItemProps {
  /** @default 'icon' */
  variant?: 'icon' | 'icon-small' | 'label'
  icon?: IconData
  /** @deprecated Use `icon` instead */
  legacyIconName?: IconName
  showLabel?: boolean
  pressed?: boolean
  dropdownIndicator?: boolean
  children?: string
  /** If not provided, `children` will be used. */
  accessibilityLabel?: string
  shortcut?: ReactNode
}

export const Item = forwardRef<HTMLButtonElement, ItemProps>(function Item(
  {
    variant = 'icon',
    icon,
    legacyIconName,
    showLabel,
    pressed,
    dropdownIndicator,
    children,
    accessibilityLabel = children,
    shortcut,
    ...props
  }: ItemProps,
  ref,
) {
  const displayLabel = Boolean(variant === 'label' || showLabel)
  let pressedValue: 'true' | 'false' | undefined = undefined
  if (pressed != null) {
    pressedValue = pressed ? 'true' : 'false'
  }
  const content = (
    <Ariakit.ToolbarItem
      aria-label={!displayLabel ? accessibilityLabel : undefined}
      aria-pressed={pressedValue}
      ref={ref}
      accessibleWhenDisabled
      {...props}
      className={clsx(
        'flex shrink-0 items-center justify-center gap-[.375rem] rounded-[.5rem] text-[#0C0C14] focus:outline-none aria-disabled:text-[#8F8D8A]',
        'aria-expanded:bg-[#C2C1C0]/20',
        variant === 'icon' && 'p-[.625rem]',
        variant === 'icon-small' && 'p-[.375rem]',
        variant === 'label' && 'p-2',
        'bg-[white]',
        // TODO: "hocus" type tw variant
        'hover:bg-[#C2C1C0]/20 focus-visible:bg-[#C2C1C0]/20 data-[focus-visible]:bg-[#C2C1C0]/20',
        // TODO: "active" tw variant
        // TODO: see hack for specificity, otherwise active styles are overridden by data-[focus-visible] :(
        'active:active:bg-[#C2C0BE]/35 data-[active]:bg-[#C2C0BE]/35',
        'aria-pressed:aria-pressed:bg-[#C2C0BE]/35',

        props.className,
      )}
    >
      {(icon || legacyIconName) && <Icon className="shrink-0" data={icon} legacyName={legacyIconName} />}
      {displayLabel && <span className="grow truncate text-start text-[.875rem]">{children}</span>}
      {dropdownIndicator && <Icon className="shrink-0" legacyName="chevron-down-filled" />}
    </Ariakit.ToolbarItem>
  )

  const showTooltip = !showLabel || Boolean(shortcut)
  if (!showTooltip) {
    return content
  }
  return (
    <Ariakit.TooltipProvider placement="bottom">
      <Ariakit.TooltipAnchor render={content} />
      <UI.Tooltip trailingSlot={shortcut ? shortcut : undefined}>{accessibilityLabel}</UI.Tooltip>
    </Ariakit.TooltipProvider>
  )
})

export interface SeparatorProps extends Ariakit.ToolbarSeparatorProps {}

export const Separator = forwardRef<HTMLHRElement, SeparatorProps>(function Separator(props, ref) {
  return (
    <Ariakit.ToolbarSeparator
      ref={ref}
      {...props}
      className={clsx('mx-2 h-[1.25rem] w-[1px] border-l border-[#D1CFCD]', props.className)}
    />
  )
})

// TODO:
// - tooltips
// - button with visible label?
// - focus & focus visible styles
// - button active styles
// - trigger open styles
