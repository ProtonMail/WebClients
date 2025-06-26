import { type ComponentPropsWithoutRef, forwardRef, type ReactNode } from 'react'
import * as Ariakit from '@ariakit/react'
import type { IconName } from '@proton/icons'
import clsx from '@proton/utils/clsx'
import { Icon, type IconData } from '../ui'

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
}

export const Item = forwardRef<HTMLButtonElement, ItemProps>(function Item(
  { variant = 'icon', icon, legacyIconName, showLabel, pressed, dropdownIndicator, children, ...props }: ItemProps,
  ref,
) {
  const displayLabel = Boolean(variant === 'label' || showLabel)
  return (
    <Ariakit.ToolbarItem
      aria-label={!displayLabel ? children : undefined}
      ref={ref}
      {...props}
      className={clsx(
        'flex shrink-0 items-center justify-center gap-[.375rem] rounded-[.5rem] text-[#0C0C14] focus:outline-none [&[disabled]]:text-[#8F8D8A]',
        'aria-expanded:bg-[#C2C1C0]/20',
        variant === 'icon' && 'p-[.625rem]',
        variant === 'icon-small' && 'p-[.375rem]',
        variant === 'label' && 'p-2',
        !pressed
          ? [
              'bg-[white]',
              // TODO: "hocus" type tw variant
              'hover:bg-[#C2C1C0]/20 focus-visible:bg-[#C2C1C0]/20 data-[focus-visible]:bg-[#C2C1C0]/20',
              // TODO: "active" tw variant
              'active:bg-[#C2C0BE]/35 data-[active]:bg-[#C2C0BE]/35',
            ]
          : [
              'TODO:',
              'bg-[red]',
              'hover:bg-[yellow] focus-visible:bg-[yellow] data-[focus-visible]:bg-[yellow]',
              'active:bg-[green] data-[active]:bg-[green]',
            ],
        props.className,
      )}
    >
      {(icon || legacyIconName) && <Icon className="shrink-0" data={icon} legacyName={legacyIconName} />}
      {displayLabel && <span className="grow truncate text-start text-[.875rem]">{children}</span>}
      {dropdownIndicator && <Icon className="shrink-0" legacyName="chevron-down-filled" />}
    </Ariakit.ToolbarItem>
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
