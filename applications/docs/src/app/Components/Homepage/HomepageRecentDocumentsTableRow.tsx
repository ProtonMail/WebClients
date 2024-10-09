import type { RecentDocumentsSnapshotData } from 'packages/docs-core'
import { c } from 'ttag'

import { Avatar, Button } from '@proton/atoms'
import { MimeIcon, Tooltip } from '@proton/components'
import { getInitials } from '@proton/shared/lib/helpers/string'

import { HomepageRecentDocumentsTableCell } from './HomepageRecentDocumentsTableCell'

import './HomepageRecentDocumentsTableRow.scss'
import { HomepageRecentDocumentsContextMenu } from './HomepageRecentDocumentsContextMenu'
import { useRecentDocuments } from './useRecentDocuments'

export function HomepageRecentDocumentsTableRow({ recentDocument }: { recentDocument: RecentDocumentsSnapshotData }) {
  const { handleOpenDocument, handleOpenFolder, getDisplayName, getDisplayDate } = useRecentDocuments()
  const displayName = getDisplayName(recentDocument)
  const location =
    recentDocument?.location && recentDocument.location?.length > 1
      ? recentDocument.location?.slice(0, -1)
      : recentDocument.location
  return (
    <tr
      role="button"
      aria-label={c('Action').t`Open`}
      className="homepage-recent-documents-table-row"
      onClick={(event) => {
        event.stopPropagation()
        handleOpenDocument(recentDocument)
      }}
    >
      <HomepageRecentDocumentsTableCell>
        <span className="flex items-center gap-3">
          <MimeIcon name="proton-doc" size={5} />
          <span className="text-pre flex-1 text-ellipsis">{recentDocument.name}</span>
        </span>
      </HomepageRecentDocumentsTableCell>
      <HomepageRecentDocumentsTableCell>
        <span className="text-capitalize">{getDisplayDate(recentDocument)}</span>
      </HomepageRecentDocumentsTableCell>
      <HomepageRecentDocumentsTableCell>
        {recentDocument.isSharedWithMe && (
          <Avatar
            color="weak"
            className="min-w-custom max-w-custom max-h-custom mr-2"
            style={{
              '--min-w-custom': '1.75rem',
              '--max-w-custom': '1.75rem',
              '--max-h-custom': '1.75rem',
            }}
          >
            {getInitials(displayName)}
          </Avatar>
        )}
        {displayName}
      </HomepageRecentDocumentsTableCell>
      <HomepageRecentDocumentsTableCell>
        <div className="flex flex-nowrap">
          <Tooltip title={location?.join(' / ')}>
            <Button
              onClick={(e) => {
                e.stopPropagation()
              }}
              shape="ghost"
              className="px-2"
            >
              {location?.[location.length - 1]}
            </Button>
          </Tooltip>
          <HomepageRecentDocumentsContextMenu
            onOpenDocument={(event) => {
              event.stopPropagation()
              handleOpenDocument(recentDocument)
            }}
            onOpenFolder={(event) => {
              event.stopPropagation()
              handleOpenFolder(recentDocument)
            }}
            isOpenFolderVisible={!!recentDocument.parentLinkId}
          />
        </div>
      </HomepageRecentDocumentsTableCell>
    </tr>
  )
}
