import * as Ariakit from '@ariakit/react'
import { clsx } from 'clsx'
import { forwardRef } from 'react'

export const Tooltip = forwardRef<HTMLDivElement, Ariakit.RoleProps>(function Tooltip(props, ref) {
  return (
    <Ariakit.Role
      ref={ref}
      {...props}
      className={clsx(
        'pointer-events-none z-50 rounded-[.5rem] bg-[#0C0C14] px-2 py-[.375rem] text-[.75rem] leading-none text-[#fff] shadow-[0px_-2px_12px_0px_rgba(0,0,0,0.05)]',
        props.className,
      )}
    />
  )
})
