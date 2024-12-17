import clsx from '@proton/utils/clsx'
import type { ComponentPropsWithoutRef } from 'react'

export function HomepageRecentDocumentsTableHeadingCell({
  hideOnSmallDevices,
  ...rest
}: ComponentPropsWithoutRef<'th'> & { hideOnSmallDevices?: boolean }) {
  return (
    <th
      className={clsx(
        'homepage-recent-documents-table-heading-cell border-bottom border-weak px-6 py-3',
        hideOnSmallDevices && 'hidden md:table-cell',
      )}
      {...rest}
    />
  )
}
