import { type ComponentPropsWithRef, forwardRef, type ReactNode } from 'react'
import * as Ariakit from '@ariakit/react'
import type { IconName } from '@proton/icons'
import clsx from '@proton/utils/clsx'
import { Icon } from '@proton/components'

export interface ContainerProps extends ComponentPropsWithRef<'div'> {
  formulaBarSlot?: ReactNode
}

export const Container = forwardRef<HTMLDivElement, ContainerProps>(function Container(
  { formulaBarSlot, ...props }: ContainerProps,
  ref,
) {
  return (
    <div ref={ref} {...props} className={clsx('bg-[#F9FBFC] px-4 pb-3', props.className)}>
      <Ariakit.Toolbar className="border-weak flex max-w-[104.5rem] items-center gap-[.125rem] rounded-t-[1rem] border bg-[white] px-3 py-[.375rem]">
        {props.children}
      </Ariakit.Toolbar>
      {formulaBarSlot}
    </div>
  )
})

export interface ButtonProps extends Ariakit.ToolbarItemProps {
  icon: IconName
  isActive?: boolean
  children?: string
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Item(
  { icon, isActive, children, ...props }: ButtonProps,
  ref,
) {
  return (
    <Ariakit.ToolbarItem
      aria-label={children}
      ref={ref}
      {...props}
      className={clsx(
        'flex h-9 w-9 items-center justify-center',
        isActive && 'TODO:',
        'rounded-[.5rem] text-[#0C0C14] hover:bg-[#C2C1C0]/20 [&[disabled]]:text-[#8F8D8A]',
        props.className,
      )}
    >
      <Icon className="text-[#0C0C14] [[disabled]_&]:text-[#8F8D8A]" name={icon} />
    </Ariakit.ToolbarItem>
  )
})

export interface TriggerProps extends Ariakit.ToolbarItemProps {
  children?: string
}

export const Trigger = forwardRef<HTMLButtonElement, TriggerProps>(function Item(
  { children, ...props }: TriggerProps,
  ref,
) {
  return (
    <Ariakit.ToolbarItem
      ref={ref}
      {...props}
      className={clsx(
        'flex h-9 items-center justify-between gap-2 rounded-[.5rem] p-2 text-[.875rem] text-[#0C0C14] hover:bg-[#C2C1C0]/20',
        props.className,
      )}
    >
      <span>{children}</span>
      <span>
        <Icon name="chevron-down-filled" />
      </span>
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
