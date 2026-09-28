import type { ComponentPropsWithoutRef, ForwardedRef } from 'react'
import { forwardRef } from 'react'
import clsx from '@proton/utils/clsx'
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
          'editor-toolbar-button interactive relative m-0 flex rounded-lg px-2.5 py-2.5',
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
