import { Tooltip } from '@proton/atoms/Tooltip/Tooltip'

const ToolbarTooltip = (props: React.ComponentProps<typeof Tooltip>) => (
  <Tooltip {...props} tooltipClassName="before:hidden p-1.5 max-w-80 rounded-lg" />
)

export default ToolbarTooltip
