import { HomepageRecentDocumentsTableRow } from './HomepageRecentDocumentsTableRow'
import { HomepageRecentDocumentsTableHeadingCell } from './HomepageRecentDocumentsTableHeadingCell'
import { useRecentDocuments } from './useRecentDocuments'

export function HomepageRecentDocumentsTable() {
  const { items } = useRecentDocuments()

  return (
    <table className="text-rg w-full" style={{ borderSpacing: 0, tableLayout: 'fixed' }}>
      <thead className="bg-norm sticky left-0 top-0">
        <tr className="text-left">
          <HomepageRecentDocumentsTableHeadingCell style={{ width: '40%', minWidth: '200px' }}>
            Name
          </HomepageRecentDocumentsTableHeadingCell>

          <HomepageRecentDocumentsTableHeadingCell style={{ width: '20%', minWidth: '100px' }}>
            Viewed
          </HomepageRecentDocumentsTableHeadingCell>

          <HomepageRecentDocumentsTableHeadingCell hideOnSmallDevices style={{ width: '20%', minWidth: '100px' }}>
            Created by
          </HomepageRecentDocumentsTableHeadingCell>

          <HomepageRecentDocumentsTableHeadingCell hideOnSmallDevices>
            <span className="px-2">Location</span>
          </HomepageRecentDocumentsTableHeadingCell>
        </tr>
      </thead>
      <tbody className="overflow-scroll">
        {items.map((recentDocument) => (
          <HomepageRecentDocumentsTableRow key={recentDocument.uniqueId()} recentDocument={recentDocument} />
        ))}
      </tbody>
    </table>
  )
}
