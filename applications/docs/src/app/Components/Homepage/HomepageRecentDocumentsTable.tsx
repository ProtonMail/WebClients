import { HomepageRecentDocumentsTableRow } from './HomepageRecentDocumentsTableRow'
import { HomepageRecentDocumentsTableHeadingCell } from './HomepageRecentDocumentsTableHeadingCell'
import { useRecentDocuments } from './useRecentDocuments'

export function HomepageRecentDocumentsTable() {
  const { items } = useRecentDocuments()
  return (
    <table className="w-full text-base" style={{ borderSpacing: 0 }}>
      <thead className="bg-norm sticky left-0 top-0">
        <tr className="text-left">
          <HomepageRecentDocumentsTableHeadingCell>Name</HomepageRecentDocumentsTableHeadingCell>
          <HomepageRecentDocumentsTableHeadingCell>Viewed</HomepageRecentDocumentsTableHeadingCell>
          <HomepageRecentDocumentsTableHeadingCell>Created by</HomepageRecentDocumentsTableHeadingCell>
          <HomepageRecentDocumentsTableHeadingCell>
            <span className="px-2">Location</span>
          </HomepageRecentDocumentsTableHeadingCell>
        </tr>
      </thead>
      <tbody className="overflow-scroll">
        {items.map((recentDocument) => (
          <HomepageRecentDocumentsTableRow key={recentDocument.linkId} recentDocument={recentDocument} />
        ))}
      </tbody>
    </table>
  )
}
