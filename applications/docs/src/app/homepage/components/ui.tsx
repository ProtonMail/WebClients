// Copy of drive/docs/realtime's packages/docs-editor/src/Components/ui.tsx (Tooltip, Button and IconButton),
// with a TooltipProvider that keeps Proton's tooltip delays.

import * as Ariakit from '@ariakit/react'
import { forwardRef } from 'react'
import * as Atoms from './atoms'

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
