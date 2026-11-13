// Copy of drive/docs/realtime's packages/docs-editor/src/Components/atoms.tsx (Tooltip and Button),
// with Proton's `outline` shape and `loading` state added to Button. Dropped what the homepage doesn't use:
// Tooltip's `trailingSlot` for shortcut hints and Button's `pill`.

import * as Ariakit from '@ariakit/react'
import { CircleLoader } from '@proton/atoms/CircleLoader/CircleLoader'
import { forwardRef } from 'react'
import { clsx } from '../utils/clsx'

export interface TooltipProps extends Ariakit.RoleProps {}
export const Tooltip = forwardRef<HTMLDivElement, TooltipProps>(function Tooltip(props, ref) {
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
    </Ariakit.Role>
  )
})

export type ButtonOptions = {
  /**
   * A `bg-[--…]` class from the caller replaces the shape's background and its hover and active states.
   * @default 'solid'
   */
  shape?: 'solid' | 'outline' | 'ghost'
  /**
   * `norm` fills a solid button with the primary colour, and colours a ghost button's text with it.
   * @default 'weak'
   */
  color?: 'norm' | 'weak'
  /** @default 'medium' */
  size?: 'small' | 'medium'
  /**
   * Square padding for an icon-only button. It needs an accessible name, such as `aria-label`.
   */
  icon?: boolean
  /** Disables the button and shows a spinner in place of its icon. */
  loading?: boolean
}
export interface ButtonProps extends Omit<Ariakit.RoleProps<'button'>, 'color'>, ButtonOptions {}

const buttonBaseClassName = clsx(
  'cursor-pointer border border-solid [outline:none]',
  '[transition:0.15s_cubic-bezier(0.22,1,0.36,1),background-position_0s]',
  'focus-visible:border-[--focus-outline] focus-visible:shadow-[0_0_0_0.1875rem_var(--focus-ring)]',
  'disabled:pointer-events-none',
)

type ButtonVariantClassNames = Record<
  NonNullable<ButtonOptions['shape']>,
  Record<NonNullable<ButtonOptions['color']>, string>
>

const ghostBackgroundClassName =
  'bg-[--interaction-default] hover:bg-[--interaction-default-hover] active:bg-[--interaction-default-active]'

const buttonBackgroundClassNames: ButtonVariantClassNames = {
  solid: {
    weak: 'bg-[--interaction-weak] hover:bg-[--interaction-weak-major-1] active:bg-[--interaction-weak-major-2]',
    norm: 'bg-[--interaction-norm] hover:bg-[--interaction-norm-major-1] active:bg-[--interaction-norm-major-2]',
  },
  outline: {
    weak: 'bg-[--background-norm] hover:bg-[--interaction-weak-minor-2] active:bg-[--interaction-weak-minor-1]',
    norm: 'bg-[--background-norm] hover:bg-[--interaction-norm-minor-2] active:bg-[--interaction-norm-minor-1]',
  },
  ghost: {
    weak: ghostBackgroundClassName,
    norm: ghostBackgroundClassName,
  },
}

const buttonBorderClassNames: Record<NonNullable<ButtonOptions['color']>, string> = {
  weak: 'border-[--interaction-weak-major-1] hover:border-[--interaction-weak-major-2] active:border-[--interaction-weak-major-3]',
  norm: 'border-[--interaction-norm-major-1] hover:border-[--interaction-norm-major-2] active:border-[--interaction-norm-major-3]',
}

const buttonTextClassNames: ButtonVariantClassNames = {
  solid: { weak: 'text-[--text-norm]', norm: 'text-[--interaction-norm-contrast]' },
  outline: { weak: 'text-[--text-norm]', norm: 'text-[--text-norm]' },
  ghost: { weak: 'text-[--text-norm]', norm: 'text-[--interaction-norm-major-1]' },
}

const disabledWeakTextClassName = 'disabled:text-[--text-weak]'

const buttonDisabledTextClassNames: ButtonVariantClassNames = {
  // At half opacity the weak text colour is as light as the primary fill, so it would hide the label or icon.
  solid: { weak: disabledWeakTextClassName, norm: '' },
  outline: { weak: disabledWeakTextClassName, norm: disabledWeakTextClassName },
  ghost: { weak: disabledWeakTextClassName, norm: disabledWeakTextClassName },
}

const ghostNormStateTextClassName =
  'hover:text-[--interaction-norm-major-2] focus:text-[--interaction-norm-major-1] active:text-[--interaction-norm-major-3]'

const buttonPaddingClassNames: Record<
  'text' | 'icon',
  Record<NonNullable<ButtonOptions['size']>, { x: string; y: string }>
> = {
  text: {
    small: { x: 'px-[calc(11em/14)]', y: 'py-[calc(3em/14)]' },
    medium: { x: 'px-[calc(15em/14)]', y: 'py-[calc(7em/14)]' },
  },
  icon: {
    small: { x: 'px-[calc(5em/14)]', y: 'py-[calc(5em/14)]' },
    medium: { x: 'px-[calc(9em/14)]', y: 'py-[calc(9em/14)]' },
  },
}

/**
 * Whether `className` has a utility, without a variant such as `hover:`, starting with one of `prefixes`.
 * Tailwind orders two utilities for the same property by its own rules, not by class order,
 * so the button drops each default the caller sets.
 */
function classNameSetsUtility(className: string | undefined, prefixes: string[]) {
  return className?.split(/\s+/).some((token) => prefixes.some((prefix) => token.startsWith(prefix))) ?? false
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    shape = 'solid',
    color = 'weak',
    size = 'medium',
    icon = false,
    loading = false,
    disabled,
    className,
    children,
    ...props
  },
  ref,
) {
  const isGhostNorm = shape === 'ghost' && color === 'norm'
  const padding = buttonPaddingClassNames[icon ? 'icon' : 'text'][size]
  return (
    <Ariakit.Role.button
      ref={ref}
      {...props}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={clsx(
        buttonBaseClassName,
        // Like Proton's button, a loading button keeps its colours: only the spinner shows it is busy.
        !loading &&
          clsx(
            'disabled:opacity-50',
            buttonDisabledTextClassNames[shape][color],
            shape === 'outline' && 'disabled:border-transparent disabled:bg-[--interaction-weak]',
          ),
        shape === 'outline' ? buttonBorderClassNames[color] : 'border-transparent',
        !classNameSetsUtility(className, ['bg-[--']) && buttonBackgroundClassNames[shape][color],
        isGhostNorm && ghostNormStateTextClassName,
        // shortcut: only `text-[--…]` counts as a caller text colour; widen the prefixes if callers use others.
        !classNameSetsUtility(className, ['text-[--']) && buttonTextClassNames[shape][color],
        !classNameSetsUtility(className, ['p-', 'px-']) && padding.x,
        !classNameSetsUtility(className, ['p-', 'py-']) && padding.y,
        !classNameSetsUtility(className, ['rounded']) && 'rounded-[--border-radius-md]',
        icon && '[&>svg]:block',
        // shortcut: the spinner covers the content, as Proton's does for icon buttons; give a text button
        // Proton's end padding for the spinner when one needs `loading`.
        loading && 'relative [&>svg]:opacity-0',
        className,
      )}
    >
      {children}
      {loading && (
        <span className="absolute inset-0 flex items-center justify-center">
          <CircleLoader />
        </span>
      )}
    </Ariakit.Role.button>
  )
})
