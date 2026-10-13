import * as Ariakit from '@ariakit/react'
import { forwardRef } from 'react'
import * as Atoms from './atoms'

export const Tooltip = forwardRef<HTMLDivElement, Ariakit.TooltipProps>(function Tooltip(props, ref) {
  return <Atoms.Tooltip ref={ref} {...props} render={<Ariakit.Tooltip render={props.render} />} />
})
