// Copy of drive/docs/realtime's packages/docs-editor/src/Components/atoms.tsx (Tooltip, Button and Avatar),
// with Proton's `outline` shape and `loading` state added to Button, and Proton's `Input`.
// Dropped what the homepage doesn't use: Tooltip's `trailingSlot` for shortcut hints, Button's `pill`
// and Avatar's author colours.

import * as Ariakit from '@ariakit/react'
import { type ComponentPropsWithoutRef, forwardRef, type ReactNode } from 'react'
import { clsx } from '../utils/clsx'
import { CircleLoader } from './CircleLoader'

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
 * so a component drops each default the caller sets.
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

export interface AvatarProps extends Ariakit.RoleProps<'span'> {}

/**
 * Initials or an icon in the 1.75rem square Proton's weak `Avatar` draws.
 * Hidden from screen readers, as Proton's is, since a name goes beside it.
 */
export const Avatar = forwardRef<HTMLSpanElement, AvatarProps>(function Avatar(props, ref) {
  return (
    <Ariakit.Role.span
      ref={ref}
      aria-hidden="true"
      {...props}
      className={clsx(
        'flex h-[1.75rem] w-[1.75rem] shrink-0 select-none items-center justify-center overflow-hidden rounded-[--border-radius-md] bg-[--background-strong] text-[.75rem] text-[--text-norm]',
        props.className,
      )}
    />
  )
})

export interface InputProps extends Omit<ComponentPropsWithoutRef<'input'>, 'prefix'> {
  /** Shown before the field, such as a search icon. */
  prefix?: ReactNode
  /** Classes for the `<input>`. `className` styles the bordered box around it, and a `border-[--…]` class replaces its border colour. */
  inputClassName?: string
}

/** Proton's `Input`: a text field in a bordered box, with an optional prefix. It keeps Proton's test ids. */
export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { prefix, inputClassName, className, disabled, ...props },
  ref,
) {
  return (
    <div
      data-testid="input-root"
      className={clsx(
        // `border-[1px]`, not `border`: Proton's global `.border` loads after Tailwind and would set its own colour.
        'relative flex flex-1 flex-nowrap items-stretch rounded-[--border-radius-md] border-[1px] border-solid',
        '[transition:0.15s_cubic-bezier(0.22,1,0.36,1),visibility_0s]',
        disabled
          ? 'border-[--field-disabled] bg-[--field-disabled-background-color] text-[--field-disabled-text-color]'
          : clsx(
              !classNameSetsUtility(className, ['border-[--']) && 'border-[--field-norm]',
              'bg-[--field-background-color] text-[--field-text-color]',
              // Tailwind puts `hover:` after `focus-within:`, so hover skips a focused field, which keeps its focus look.
              '[&:hover:not(:focus-within)]:border-[--field-hover] [&:hover:not(:focus-within)]:bg-[--field-hover-background-color] [&:hover:not(:focus-within)]:text-[--field-hover-text-color]',
              'focus-within:border-[--focus-outline] focus-within:bg-[--field-focus-background-color] focus-within:text-[--field-focus-text-color] focus-within:shadow-[0_0_0_0.1875rem_var(--focus-ring)]',
            ),
        className,
      )}
    >
      {prefix && (
        <div
          data-testid="input-prefix"
          className={clsx(
            'ms-3 flex max-w-[60%] shrink-0 flex-nowrap items-center gap-2',
            !disabled && 'text-[--text-weak]',
          )}
        >
          {prefix}
        </div>
      )}
      <div className="flex flex-1">
        <input
          ref={ref}
          autoComplete="off"
          autoCapitalize="off"
          autoCorrect="off"
          spellCheck="false"
          disabled={disabled}
          data-testid="input-input-element"
          {...props}
          className={clsx(
            'min-h-[2.125rem] w-full rounded-[--border-radius-md] py-[calc(7em/14)] [background:none] [color:inherit] [filter:none] [outline:none]',
            // Below `small` the text is at least 16px, so iOS doesn't zoom in on focus.
            'text-[max(16px,1em)] small:text-[1em]',
            'pe-[calc(8em/14)] xsmall:pe-[calc(12em/14)]',
            prefix ? 'ps-[.5em]' : 'ps-[calc(8em/14)] xsmall:ps-[calc(12em/14)]',
            inputClassName,
          )}
        />
      </div>
    </div>
  )
})
