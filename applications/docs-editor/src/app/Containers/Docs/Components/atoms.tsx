import * as Ariakit from '@ariakit/react'
import { clsx } from 'clsx'
import type { ReactNode } from 'react'
import { forwardRef } from 'react'
import tinycolor from 'tinycolor2'
import { getAccentColorForUsername } from '../Utils/getAccentColorForUsername'

export type TooltipOptions = {
  /**
   * A slot for trailing content, such as keyboard shortcut hints.
   */
  trailingSlot?: ReactNode
}
export interface TooltipProps extends Ariakit.RoleProps, TooltipOptions {}
export const Tooltip = forwardRef<HTMLDivElement, TooltipProps>(function Tooltip({ trailingSlot, ...props }, ref) {
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
      {trailingSlot && <span className="flex shrink-0 items-center">{trailingSlot}</span>}
    </Ariakit.Role>
  )
})

export type ButtonOptions = {
  /**
   * A `bg-[--…]` class from the caller replaces the shape's background and its hover and active states.
   * @default 'solid'
   */
  shape?: 'solid' | 'ghost'
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
  pill?: boolean
}
export interface ButtonProps extends Omit<Ariakit.RoleProps<'button'>, 'color'>, ButtonOptions {}

const buttonBaseClassName = clsx(
  'cursor-pointer [border:1px_solid_transparent] [outline:none]',
  '[transition:0.15s_cubic-bezier(0.22,1,0.36,1),background-position_0s]',
  'focus-visible:border-[--focus-outline] focus-visible:shadow-[0_0_0_0.1875rem_var(--focus-ring)]',
  'disabled:pointer-events-none disabled:opacity-50',
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
  ghost: {
    weak: ghostBackgroundClassName,
    norm: ghostBackgroundClassName,
  },
}

const buttonTextClassNames: ButtonVariantClassNames = {
  solid: { weak: 'text-[--text-norm]', norm: 'text-[--interaction-norm-contrast]' },
  ghost: { weak: 'text-[--text-norm]', norm: 'text-[--interaction-norm-major-1]' },
}

const disabledWeakTextClassName = 'disabled:text-[--text-weak]'

const buttonDisabledTextClassNames: ButtonVariantClassNames = {
  // At half opacity the weak text colour is as light as the primary fill, so it would hide the label or icon.
  solid: { weak: disabledWeakTextClassName, norm: '' },
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
  { shape = 'solid', color = 'weak', size = 'medium', icon = false, pill = false, className, ...props },
  ref,
) {
  const isGhostNorm = shape === 'ghost' && color === 'norm'
  const padding = buttonPaddingClassNames[icon ? 'icon' : 'text'][size]
  return (
    <Ariakit.Role.button
      ref={ref}
      {...props}
      className={clsx(
        buttonBaseClassName,
        buttonDisabledTextClassNames[shape][color],
        !classNameSetsUtility(className, ['bg-[--']) && buttonBackgroundClassNames[shape][color],
        isGhostNorm && ghostNormStateTextClassName,
        // shortcut: only `text-[--…]` counts as a caller text colour; widen the prefixes if callers use others.
        !classNameSetsUtility(className, ['text-[--']) && buttonTextClassNames[shape][color],
        !classNameSetsUtility(className, ['p-', 'px-']) && padding.x,
        !classNameSetsUtility(className, ['p-', 'py-']) && padding.y,
        !classNameSetsUtility(className, ['rounded']) && (pill ? 'rounded-[2em]' : 'rounded-[--border-radius-md]'),
        icon && '[&>svg]:block',
        className,
      )}
    />
  )
})

export interface AvatarProps extends Omit<Ariakit.RoleProps<'span'>, 'color'> {
  /** The name the avatar stands for. Its initial and, without `color`, its colour come from it. */
  name?: string
  /** The author's awareness colour, an `hsl()` string. */
  color?: string
}

/**
 * Proton's `UserAvatar` reads the hue off the awareness colour with a regex that drops a hue of 0,
 * and falls back to the name's accent colour. Keep both, so a collaborator's avatar does not change
 * colour now that Docs picks it here.
 */
function getAvatarHue(name: string, color: string | undefined) {
  const awarenessColor = color ? tinycolor(color) : undefined
  if (awarenessColor?.isValid()) {
    const hue = awarenessColor.toHsl().h
    if (hue) {
      return hue
    }
  }
  return tinycolor(getAccentColorForUsername(name)).toHsl().h
}

/**
 * An author's initial on their own colour, in the 1.75rem square Proton's `UserAvatar` draws.
 * Name it with `aria-label` and `role="img"`, or hide it with `aria-hidden` where the name is
 * already shown beside it.
 */
export const Avatar = forwardRef<HTMLSpanElement, AvatarProps>(function Avatar(
  { name, color, children, ...props },
  ref,
) {
  const hue = name ? getAvatarHue(name, color) : undefined
  return (
    <Ariakit.Role.span
      ref={ref}
      {...props}
      className={clsx(
        'flex h-[1.75rem] w-[1.75rem] shrink-0 select-none items-center justify-center overflow-hidden rounded-[--border-radius-md] text-[.75rem] font-semibold capitalize',
        hue === undefined && 'bg-[--background-strong]',
        props.className,
      )}
      style={
        hue === undefined
          ? props.style
          : { backgroundColor: `hsl(${hue}, 100%, 90%)`, color: `hsl(${hue}, 100%, 10%)`, ...props.style }
      }
    >
      {children ?? name?.slice(0, 1)}
    </Ariakit.Role.span>
  )
})

export interface BadgeProps extends Ariakit.RoleProps<'span'> {}
export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(function Badge(props, ref) {
  return (
    <Ariakit.Role.span
      ref={ref}
      {...props}
      className={clsx(
        'rounded-sm bg-[--signal-info-minor-1] px-1 py-0.5 text-[0.625rem] font-semibold uppercase leading-none text-[--signal-info]',
        props.className,
      )}
    />
  )
})

export interface KbdProps extends Ariakit.RoleProps<'kbd'> {}
export const Kbd = forwardRef<HTMLDivElement, KbdProps>(function Kbd(props, ref) {
  return (
    <Ariakit.Role
      ref={ref}
      render={<kbd />}
      {...props}
      className={clsx(
        "relative rounded-[--border-radius-sm] px-[.25em] before:absolute before:inset-0 before:rounded-[inherit] before:bg-[--background-strong] before:opacity-20 before:content-['']",
        props.className,
      )}
    />
  )
})
