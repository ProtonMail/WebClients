import * as Ariakit from '@ariakit/react'
import type { ReactElement, ReactNode } from 'react'
import { useId } from 'react'
import { Tooltip } from '../Components/ui'

type ToolbarTooltipProps = {
  title: ReactNode
  originalPlacement?: Ariakit.TooltipProviderProps['placement']
  children: ReactElement
}

function ToolbarTooltip({ title, originalPlacement = 'top', children }: ToolbarTooltipProps) {
  const tooltipId = useId()

  if (!title) {
    return children
  }

  return (
    <Ariakit.TooltipProvider placement={originalPlacement}>
      {/* Icon-only anchors rely on the tooltip text, so it is wired as their description. */}
      <Ariakit.TooltipAnchor render={children} aria-describedby={tooltipId} />
      <Tooltip id={tooltipId} portal gutter={4} className="max-w-80 rounded-lg !p-1.5">
        {title}
      </Tooltip>
    </Ariakit.TooltipProvider>
  )
}

export default ToolbarTooltip
