// Copy of drive/docs/realtime's packages/docs-editor/src/Components/ui.tsx (Tooltip, Button and IconButton),
// with a TooltipProvider that keeps Proton's tooltip delays, and a Checkbox with Proton's look.

import * as Ariakit from '@ariakit/react'
import { forwardRef, type MouseEventHandler } from 'react'
import { clsx } from '../utils/clsx'
import * as Atoms from './atoms'
import { Icon } from './Icon'
import * as Icons from './icons'

export interface TooltipProps extends Ariakit.TooltipProps, Atoms.TooltipProps {}
/** Mounted only while shown, as Proton's `Tooltip` is, so a table row adds none to the page. */
export const Tooltip = forwardRef<HTMLDivElement, TooltipProps>(function Tooltip(props, ref) {
  return (
    <Atoms.Tooltip
      ref={ref}
      portal
      gutter={4}
      unmountOnHide
      {...props}
      render={<Ariakit.Tooltip render={props.render} />}
    />
  )
})

export interface TooltipProviderProps extends Ariakit.TooltipProviderProps {}
/** With Proton's `Tooltip` delays. */
export function TooltipProvider(props: TooltipProviderProps) {
  return <Ariakit.TooltipProvider showTimeout={1000} hideTimeout={250} {...props} />
}

export interface ButtonProps extends Omit<Ariakit.ButtonProps, 'color'>, Atoms.ButtonOptions {}
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(props, ref) {
  return <Atoms.Button ref={ref} type="button" {...props} render={<Ariakit.Button render={props.render} />} />
})

export interface IconButtonProps extends ButtonProps {
  label: string
}
/** An icon-only `Button` named by `label`, which it also shows as a tooltip. An `aria-label` overrides the name. */
export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton({ label, ...props }, ref) {
  return (
    <TooltipProvider>
      <Ariakit.TooltipAnchor render={<Button ref={ref} icon aria-label={label} {...props} />} />
      <Tooltip aria-hidden="true">{label}</Tooltip>
    </TooltipProvider>
  )
})

export interface CheckboxProps extends Omit<Ariakit.CheckboxProps, 'className'> {
  /** The click area covers the nearest positioned ancestor, as Proton's `expand-click-area` does. */
  expandClickArea?: boolean
  /** Firefox doesn't pass shift-clicks on a label to its input, so they arrive here instead. */
  labelOnClick?: MouseEventHandler<HTMLLabelElement>
}

// Proton's packages/styles/scss/base/forms/_checkbox.scss. The state picks its colours, as Tailwind can't order
// `peer-hover:` after `peer-checked:` the way Proton's selectors do.
const fakeCheckClassNames = {
  enabled: {
    unchecked: clsx(
      'border-[--field-norm] bg-[--field-background-color] text-[--field-text-color]',
      'peer-hover:border-[--interaction-norm] peer-hover:bg-[--field-hover-background-color] peer-hover:text-[--field-hover-text-color]',
      'peer-focus-visible:border-[--interaction-norm] peer-focus-visible:bg-[--field-focus-background-color] peer-focus-visible:text-[--field-focus-text-color]',
      'peer-focus-visible:shadow-[0_0_0_0.1875rem_var(--focus-ring)]',
    ),
    checked: clsx(
      'border-[--interaction-norm] bg-[--interaction-norm] text-[--interaction-norm-contrast]',
      'peer-hover:border-[--interaction-norm-hover] peer-hover:bg-[--interaction-norm-hover]',
      'peer-focus-visible:shadow-[0_0_0_0.1875rem_var(--focus-ring)]',
    ),
  },
  disabled: {
    unchecked: 'border-[--field-disabled] bg-[--field-disabled-background-color] text-[--field-disabled-text-color]',
    checked: 'border-[--field-disabled] bg-[--field-disabled] text-[--interaction-norm-contrast]',
  },
}

/** Proton's `Checkbox`: a native checkbox under a drawn box. `checked="mixed"` shows a dash. */
export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(function Checkbox(
  { expandClickArea = false, labelOnClick, checked, disabled, ...props },
  ref,
) {
  const iconClassName = clsx(
    'm-auto',
    checked
      ? 'scale-100 [transition:0.15s_transform_cubic-bezier(0.34,1.56,0.64,1)_0.1s]'
      : 'scale-0 [transition:0.15s_transform_cubic-bezier(0.34,1.56,0.64,1)]',
  )
  return (
    // oxlint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-noninteractive-element-interactions
    <label
      className={clsx(
        'inline-flex',
        expandClickArea ? "before:absolute before:inset-0 before:content-['']" : 'relative',
      )}
      onClick={labelOnClick}
    >
      <Ariakit.Checkbox
        ref={ref}
        checked={checked}
        disabled={disabled}
        {...props}
        // opacity-[0], because Proton's own `.opacity-0` (packages/styles/scss/utilities/_opacity.scss) also turns
        // off pointer events, which would leave the clicks to the label.
        className="peer absolute inset-0 z-[1] m-0 h-full w-full cursor-pointer opacity-[0] disabled:cursor-default"
      />
      <span
        className={clsx(
          'my-auto inline-flex h-5 w-5 min-w-5 rounded-[--border-radius-sm] border-[1px] border-solid',
          '[transition:0.15s_cubic-bezier(0.33,1,0.68,1)]',
          // "mixed" keeps the unchecked colours, as Proton's indeterminate checkbox does.
          fakeCheckClassNames[disabled ? 'disabled' : 'enabled'][checked === true ? 'checked' : 'unchecked'],
        )}
      >
        {checked === 'mixed' ? (
          <Icon data={Icons.minus} className={clsx(iconClassName, 'text-[--text-disabled]')} />
        ) : (
          <Icon data={Icons.checkmark} className={iconClassName} />
        )}
      </span>
    </label>
  )
})
