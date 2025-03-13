import clsx from '@proton/utils/clsx'
import type { ComponentPropsWithoutRef } from 'react'

export function HomepageRecentDocumentsTableCell({
  hideOnSmallDevices,
  ...rest
}: ComponentPropsWithoutRef<'td'> & { hideOnSmallDevices?: boolean }) {
  return (
    <td
      className={clsx('border-weak border-bottom px-6 py-3', hideOnSmallDevices && 'hidden md:table-cell')}
      {...rest}
    />
  )
}
