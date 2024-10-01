import { DropdownMenuButton, Icon } from '@proton/components'
import clsx from '@proton/utils/clsx'
import type { ReactNode } from 'react'

export function InteractionDropdownButton({
  isActive,
  onClick,
  icon,
  label,
  description,
  ...other
}: {
  isActive: boolean
  onClick: () => void
  icon: ReactNode
  label: string
  description: string
  'data-testid': string
}) {
  return (
    <DropdownMenuButton
      className={clsx(
        'grid grid-cols-[auto,1fr,auto] grid-rows-2 place-items-start items-center gap-x-3 gap-y-1 text-sm',
        isActive && 'active',
      )}
      onClick={onClick}
      data-testid={other['data-testid']}
    >
      {icon}
      <div className={clsx('[grid-column:2] [grid-row:1]', isActive && 'font-bold')}>{label}</div>
      <div className="text-weak text-xs [grid-column:2] [grid-row:2]">{description}</div>
      <Icon
        name="checkmark"
        className={clsx('ml-auto opacity-0 [grid-column:3] [grid-row:1]', isActive && 'opacity-100')}
        size={4.5}
      />
    </DropdownMenuButton>
  )
}
