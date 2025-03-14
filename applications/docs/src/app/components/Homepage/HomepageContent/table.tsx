import clsx from '@proton/utils/clsx'
import type { ComponentPropsWithoutRef } from 'react'

export type HeadingCellProps = ComponentPropsWithoutRef<'th'> & { hideOnSmallDevices?: boolean }

export function HeadingCell({ hideOnSmallDevices, ...rest }: HeadingCellProps) {
  return (
    <th
      className={clsx('border-bottom border-weak px-6 py-3', hideOnSmallDevices && 'hidden md:table-cell')}
      {...rest}
    />
  )
}

export type CellProps = ComponentPropsWithoutRef<'td'> & { hideOnSmallDevices?: boolean }

export function Cell({ hideOnSmallDevices, ...props }: CellProps) {
  return (
    <td
      {...props}
      className={clsx(
        'border-weak border-bottom px-6 py-3',
        hideOnSmallDevices && 'hidden md:table-cell',
        props.className,
      )}
    />
  )
}
