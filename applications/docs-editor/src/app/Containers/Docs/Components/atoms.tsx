import * as Ariakit from '@ariakit/react'
import { clsx } from 'clsx'
import type { ReactNode } from 'react'
import { forwardRef } from 'react'

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
        'pointer-events-none z-50 flex items-center gap-1 rounded-[.5rem] bg-[#0C0C14] px-2 py-[.375rem] text-[.75rem] leading-none text-[#fff] shadow-[0px_-2px_12px_0px_rgba(0,0,0,0.05)]',
        props.className,
      )}
    >
      <span className="grow leading-none">{props.children}</span>
      {trailingSlot && <span className="flex shrink-0 items-center">{trailingSlot}</span>}
    </Ariakit.Role>
  )
})

export interface KbdProps extends Ariakit.RoleProps<'kbd'> {}
export const Kbd = forwardRef<HTMLDivElement, KbdProps>(function Kbd(props, ref) {
  return (
    <Ariakit.Role
      ref={ref}
      render={<kbd />}
      {...props}
      className={clsx(
        "relative rounded-[--border-radius-sm] px-[.25em] before:absolute before:inset-0 before:rounded-[inherit] before:bg-[--background-strong] before:opacity-20 before:content-['']",
        props.className,
      )}
    />
  )
})
