import type { ComponentPropsWithoutRef, ReactNode } from 'react'
import * as Ariakit from '@ariakit/react'
import { clsx } from 'clsx'
import { Tooltip } from '../../Components/ui'

type Props = Omit<ComponentPropsWithoutRef<'button'>, 'children'> & {
  label: string
  children: ReactNode
}

export function LinkIconButton({ label, children, className, ...props }: Props) {
  return (
    <Ariakit.TooltipProvider placement="top">
      <Ariakit.TooltipAnchor
        render={
          <Ariakit.Button type="button" aria-label={label} accessibleWhenDisabled {...props}>
            {children}
          </Ariakit.Button>
        }
        className={clsx(
          'flex shrink-0 items-center justify-center rounded-[.625rem] bg-[--background-norm] p-[.375rem] text-[--text-norm] hover:bg-[--interaction-weak-minor-2] focus:outline-none focus-visible:bg-[--interaction-weak-minor-2] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[--focus-outline] active:bg-[--interaction-weak-minor-1] aria-disabled:text-[--text-hint] data-[active]:bg-[--interaction-weak-minor-1] data-[focus-visible]:bg-[--interaction-weak-minor-2]',
          className,
        )}
      />
      <Tooltip aria-hidden="true" portal gutter={4}>
        {label}
      </Tooltip>
    </Ariakit.TooltipProvider>
  )
}
