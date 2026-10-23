import type { ComponentPropsWithoutRef, ForwardedRef } from 'react'
import { forwardRef } from 'react'
import clsx from 'clsx'
import ToolbarTooltip from './ToolbarTooltip'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { fixEmptyRoot } from '../Utils/fixEmptyRoot'

interface ToolbarButtonProps extends ComponentPropsWithoutRef<'button'> {
  label: React.ReactNode
  active?: boolean
}

export const ToolbarButton = forwardRef(function ToolbarButton(
  { label, active, children, className, onClick, ...rest }: ToolbarButtonProps,
  ref: ForwardedRef<HTMLButtonElement>,
) {
  const [editor] = useLexicalComposerContext()

  return (
    <ToolbarTooltip title={label}>
      <button
        type="button"
        className={clsx([
          'editor-toolbar-button relative m-0 flex rounded-lg px-2.5 py-2.5',
          'bg-[--interaction-default] [outline:none] [transition:0.15s_cubic-bezier(0.22,1,0.36,1),background-position_0s]',
          'hover:bg-[--interaction-default-hover] active:bg-[--interaction-default-active] aria-expanded:bg-[--interaction-default-active] [&.active]:bg-[--interaction-default-active]',
          'focus-visible:shadow-[0_0_0_0.1875rem_var(--focus-ring)] disabled:pointer-events-none disabled:opacity-50',
          active && 'active',
          className,
        ])}
        ref={ref}
        onClick={(event) => {
          fixEmptyRoot(editor)
          onClick?.(event)
        }}
        {...rest}
      >
        {children}
      </button>
    </ToolbarTooltip>
  )
})
