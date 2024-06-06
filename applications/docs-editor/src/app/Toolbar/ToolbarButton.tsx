import { ComponentPropsWithoutRef, ForwardedRef, forwardRef } from 'react'
import clsx from '@proton/utils/clsx'
import { Tooltip } from '@proton/components'

interface ToolbarButtonProps extends ComponentPropsWithoutRef<'button'> {
  label: string
  active?: boolean
}

export const ToolbarButton = forwardRef(function ToolbarButton(
  { label, active, children, className, ...rest }: ToolbarButtonProps,
  ref: ForwardedRef<HTMLButtonElement>,
) {
  return (
    <Tooltip title={label}>
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
    </Tooltip>
  )
})
