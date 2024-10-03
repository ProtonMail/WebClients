import type { ComponentPropsWithoutRef } from 'react'
import './HomepageRecentDocumentsTableHeadingCell.scss'

export function HomepageRecentDocumentsTableHeadingCell(props: ComponentPropsWithoutRef<'th'>) {
  return <th className="homepage-recent-documents-table-heading-cell border-bottom border-weak px-6 py-3" {...props} />
}
