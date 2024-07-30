import type { ComponentPropsWithoutRef, ForwardedRef } from 'react'
import { forwardRef } from 'react'
import clsx from '@proton/utils/clsx'
import ToolbarTooltip from './ToolbarTooltip'

interface ToolbarButtonProps extends ComponentPropsWithoutRef<'button'> {
  label: React.ReactNode
  active?: boolean
}

export const ToolbarButton = forwardRef(function ToolbarButton(
  { label, active, children, className, ...rest }: ToolbarButtonProps,
  ref: ForwardedRef<HTMLButtonElement>,
) {
  return (
    <ToolbarTooltip title={label}>
      <button
        type="button"
        className={clsx([
          'editor-toolbar-button interactive relative m-0 flex rounded-lg px-2.5 py-2.5',
          active && 'active',
          className,
        ])}
        ref={ref}
        {...rest}
      >
        {children}
      </button>
    </ToolbarTooltip>
  )
})
