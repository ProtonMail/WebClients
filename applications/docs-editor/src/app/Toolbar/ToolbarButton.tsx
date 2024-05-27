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
          'relative rounded-lg px-2.5 py-2.5',
          active ? 'bg-[--primary-minor-2]' : 'bg-none enabled:hover:bg-[--primary-minor-1]',
          'editor-toolbar-button interactive-pseudo-inset m-0 flex',
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
