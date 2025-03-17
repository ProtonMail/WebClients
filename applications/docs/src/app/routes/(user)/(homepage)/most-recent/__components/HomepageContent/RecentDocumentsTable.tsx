import { useRecentDocuments } from '../../__utils/recent-documents'
import { useRef } from 'react'
import { DocContextMenu } from './DocContextMenu/DocContextMenu'
import { useContextMenu } from './DocContextMenu/context'
import { Cell, HeadingCell } from './table'
import type { RecentDocumentItem } from '@proton/docs-core'
import { Icon, MimeIcon, Tooltip } from '@proton/components'
import { c } from 'ttag'
import { Avatar, Button } from '@proton/atoms'
import { getInitials } from '@proton/shared/lib/helpers/string'

export function RecentDocumentsTable() {
  const { items } = useRecentDocuments()
  const contextMenuAnchorRef = useRef<HTMLDivElement>(null)
  const contextMenu = useContextMenu()

  return (
    <>
      <table className="text-rg w-full" style={{ borderSpacing: 0, tableLayout: 'fixed' }}>
        <thead className="bg-norm sticky left-0 top-0">
          <tr className="text-left">
            <HeadingCell style={{ width: '40%', minWidth: '200px' }}>Name</HeadingCell>

            <HeadingCell style={{ width: '20%', minWidth: '100px' }}>Viewed</HeadingCell>

            <HeadingCell hideOnSmallDevices style={{ width: '20%', minWidth: '100px' }}>
              Created by
            </HeadingCell>

            <HeadingCell hideOnSmallDevices>
              <span className="px-2">Location</span>
            </HeadingCell>
          </tr>
        </thead>
        <tbody className="overflow-scroll">
          {items.map((recentDocument) => (
            <Row key={recentDocument.uniqueId()} recentDocument={recentDocument} />
          ))}
        </tbody>
      </table>
      <DocContextMenu
        currentDocument={contextMenu.currentDocument}
        anchorRef={contextMenuAnchorRef}
        close={contextMenu.close}
        isOpen={contextMenu.isOpen}
        open={contextMenu.open}
        position={contextMenu.position}
      />
    </>
  )
}

type RowProps = { recentDocument: RecentDocumentItem }

function Row({ recentDocument }: RowProps) {
  const { handleOpenDocument, handleOpenFolder, getDisplayName, getDisplayDate } = useRecentDocuments()
  const displayName = getDisplayName(recentDocument)
  const location =
    recentDocument?.location && recentDocument.location?.length > 1
      ? recentDocument.location?.slice(0, -1)
      : recentDocument.location
  const contextMenu = useContextMenu()
  return (
    // eslint-disable-next-line jsx-a11y/prefer-tag-over-role
    <tr
      role="button"
      aria-label={c('Action').t`Open`}
      className="cursor-pointer hover:bg-[--interaction-default-hover]"
      onClick={(event) => {
        event.stopPropagation()
        handleOpenDocument(recentDocument)
      }}
      onContextMenu={(event) => {
        event.stopPropagation()
        contextMenu.setCurrentDocument(recentDocument)
        contextMenu.handleContextMenu(event)
      }}
    >
      <Cell>
        <span className="flex items-center gap-3">
          <MimeIcon name="proton-doc" size={5} />
          <span className="text-pre flex-1 text-ellipsis">{recentDocument.name}</span>
        </span>
      </Cell>

      <Cell>
        <span className="text-capitalize">{getDisplayDate(recentDocument)}</span>
      </Cell>

      <Cell hideOnSmallDevices>
        <span className="flex items-center">
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
          <span className="text-pre flex-1 text-ellipsis">{displayName}</span>
        </span>
      </Cell>

      <Cell hideOnSmallDevices>
        <div className="flex flex-nowrap">
          <Tooltip title={location?.join(' / ')}>
            <Button
              onClick={(event) => {
                event.stopPropagation()
                handleOpenFolder(recentDocument)
              }}
              shape="ghost"
              className="text-pre text-ellipsis px-2"
            >
              {location?.[location.length - 1]}
            </Button>
          </Tooltip>

          <Button
            onClick={(event) => {
              event.stopPropagation()
              contextMenu.setCurrentDocument(recentDocument)
              contextMenu.handleContextMenu(event)
            }}
            shape="ghost"
            className="ml-auto shrink-0 px-2"
            aria-label={c('Action').t`Context menu`}
          >
            <Icon name="three-dots-vertical" />
          </Button>
        </div>
      </Cell>
    </tr>
  )
}
