import * as Ariakit from '@ariakit/react'
import { forwardRef } from 'react'
import * as Atoms from './atoms'

export interface TooltipProps extends Ariakit.TooltipProps, Atoms.TooltipOptions {}
export const Tooltip = forwardRef<HTMLDivElement, TooltipProps>(function Tooltip(props, ref) {
  return <Atoms.Tooltip ref={ref} {...props} render={<Ariakit.Tooltip render={props.render} />} />
})

export interface ButtonProps extends Omit<Ariakit.ButtonProps, 'color'>, Atoms.ButtonOptions {}
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(props, ref) {
  return <Atoms.Button ref={ref} type="button" {...props} render={<Ariakit.Button render={props.render} />} />
})

export interface IconButtonProps extends ButtonProps {
  label: string
}
/** An icon-only `Button` named by `label`, which it also shows as a tooltip. */
export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton({ label, ...props }, ref) {
  return (
    <Ariakit.TooltipProvider>
      <Ariakit.TooltipAnchor render={<Button ref={ref} icon aria-label={label} {...props} />} />
      <Tooltip aria-hidden="true" portal gutter={4}>
        {label}
      </Tooltip>
    </Ariakit.TooltipProvider>
  )
})
