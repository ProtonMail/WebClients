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
  const menu = Ariakit.useMenuContext()

  if (!title) {
    return children
  }

  return (
    <Ariakit.TooltipProvider placement={originalPlacement}>
      {/* Icon-only anchors rely on the tooltip text, so it is wired as their description. */}
      <Ariakit.TooltipAnchor render={children} aria-describedby={tooltipId} />
      <Tooltip
        id={tooltipId}
        portal
        gutter={4}
        className="max-w-80 rounded-lg !p-1.5"
        hideOnEscape={(event) => {
          // An open tooltip is the topmost Ariakit dialog, so the menu around a menu item ignores Escape.
          // Close that menu too, unless focus is in one of its portalled submenus.
          const menuElement = menu?.getState().contentElement
          if (menuElement && event.target instanceof Node && menuElement.contains(event.target)) {
            menu.hide()
          }
          return true
        }}
      >
        {title}
      </Tooltip>
    </Ariakit.TooltipProvider>
  )
}

export default ToolbarTooltip
