import * as Ariakit from '@ariakit/react'
import { clsx } from 'clsx'
import { forwardRef } from 'react'

export interface ButtonProps extends Ariakit.ButtonProps {
  color?: 'norm' | 'weak'
  size?: 'small' | 'medium'
}

const baseClasses = clsx(
  'inline-block cursor-pointer rounded-[--border-radius-md] border text-center no-underline outline-none',
  '[transition:0.15s_cubic-bezier(0.22,1,0.36,1),background-position_0s]',
  'hover:no-underline focus:no-underline active:no-underline',
  'focus-visible:border-[--focus-outline] focus-visible:shadow-[0_0_0_0.1875rem_var(--focus-ring)]',
  'disabled:pointer-events-none disabled:border-transparent disabled:bg-[--interaction-weak] disabled:text-[--text-weak] disabled:opacity-50',
)

const colorClasses: Record<NonNullable<ButtonProps['color']>, string> = {
  norm: clsx(
    'border-transparent bg-[--interaction-norm] text-[--interaction-norm-contrast]',
    'hover:border-transparent hover:bg-[--interaction-norm-major-1] hover:text-[--interaction-norm-contrast]',
    'active:border-transparent active:bg-[--interaction-norm-major-2] active:text-[--interaction-norm-contrast]',
    '[--focus-outline:var(--interaction-norm-major-2)]',
  ),
  weak: clsx(
    'border-[--interaction-weak-major-1] bg-[--background-norm] text-[--text-norm]',
    'hover:border-[--interaction-weak-major-2] hover:bg-[--interaction-weak-minor-2] hover:text-[--text-norm]',
    'active:border-[--interaction-weak-major-3] active:bg-[--interaction-weak-minor-1] active:text-[--text-norm]',
  ),
}

const sizePaddingClasses: Record<
  NonNullable<ButtonProps['size']>,
  { top: string; right: string; bottom: string; left: string }
> = {
  small: {
    top: 'pt-[0.1875em]',
    right: 'pr-[0.6875em]',
    bottom: 'pb-[0.1875em]',
    left: 'pl-[0.6875em]',
  },
  medium: {
    top: 'pt-[0.4375em]',
    right: 'pr-[0.9375em]',
    bottom: 'pb-[0.4375em]',
    left: 'pl-[0.9375em]',
  },
}

function hasUnprefixedClass(className: string | undefined, prefixes: string[]) {
  return className?.split(/\s+/).some((token) => prefixes.some((prefix) => token.startsWith(prefix))) ?? false
}

function getSizeClasses(size: NonNullable<ButtonProps['size']>, className?: string) {
  const hasTopPadding = hasUnprefixedClass(className, ['p-', 'py-', 'pt-'])
  const hasRightPadding = hasUnprefixedClass(className, ['p-', 'px-', 'pr-'])
  const hasBottomPadding = hasUnprefixedClass(className, ['p-', 'py-', 'pb-'])
  const hasLeftPadding = hasUnprefixedClass(className, ['p-', 'px-', 'pl-'])

  return clsx(
    !hasTopPadding && sizePaddingClasses[size].top,
    !hasRightPadding && sizePaddingClasses[size].right,
    !hasBottomPadding && sizePaddingClasses[size].bottom,
    !hasLeftPadding && sizePaddingClasses[size].left,
  )
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, color = 'weak', size = 'medium', type = 'button', ...props },
  ref,
) {
  return (
    <Ariakit.Button
      ref={ref}
      type={type}
      {...props}
      className={clsx(baseClasses, colorClasses[color], getSizeClasses(size, className), className)}
    />
  )
})
