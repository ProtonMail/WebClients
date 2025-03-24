import { useRecentDocuments } from '../../__utils/recent-documents'
import type { ReactNode } from 'react'
import { useRef, useState } from 'react'
import { DocContextMenu } from './DocContextMenu/DocContextMenu'
import { useContextMenu } from './DocContextMenu/context'
import * as Table from './table'
import type { RecentDocumentsItem } from '@proton/docs-core'
import type { IconName } from '@proton/components'
import { Icon, Tooltip } from '@proton/components'
import { c } from 'ttag'
import { Avatar, Button } from '@proton/atoms'
import { getInitials } from '@proton/shared/lib/helpers/string'

type Sort = 'viewed' | 'modified' | 'name'

export function RecentDocumentsTable() {
  const { items } = useRecentDocuments()
  const contextMenuAnchorRef = useRef<HTMLDivElement>(null)
  const contextMenu = useContextMenu()
  const [sort, _setSort] = useState<Sort>('viewed')

  return (
    <>
      <table className="w-full table-fixed text-[.875rem]">
        <Head sort={sort} label={c('Recent documents table header').t`Name`} />
        <tbody className="divide-y divide-[--border-weak] overflow-scroll">
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

const VIEWED_LABEL = c('Recent documents table header').t`Viewed`

type HeadProps = { sort: Sort; isSecondary?: boolean; label: ReactNode }

function Head({ sort, isSecondary = false, label }: HeadProps) {
  let secondHeaderContent: ReactNode
  if (sort === 'modified' || sort === 'viewed') {
    secondHeaderContent = (
      <span className="flex items-center gap-[.375rem]">
        <span>{sort === 'modified' ? c('Recent documents table header').t`Modified` : VIEWED_LABEL}</span>
        <Icon name="arrow-down" size={4} className="text-[--icon-norm]" />
      </span>
    )
  } else {
    secondHeaderContent = VIEWED_LABEL
  }
  return (
    <Table.Head>
      <Table.Header colSpan={!isSecondary ? undefined : 4}>{label}</Table.Header>
      {!isSecondary ? (
        <>
          <Table.Header>{secondHeaderContent}</Table.Header>
          <Table.Header>{c('Recent documents table header').t`Created by`}</Table.Header>
          <Table.Header>{c('Recent documents table header').t`Location`}</Table.Header>
        </>
      ) : null}
    </Table.Head>
  )
}

type RowProps = { recentDocument: RecentDocumentsItem }

function Row({ recentDocument }: RowProps) {
  const { handleOpenDocument, handleOpenFolder, getDisplayName, getDisplayDate } = useRecentDocuments()
  const { location } = recentDocument
  const displayName = getDisplayName(recentDocument)

  if (!location) {
    throw new Error('Unexpected missing location')
  }

  let locationIcon: IconName
  let locationLabel: string
  if (location?.type === 'shared-with-me') {
    locationIcon = 'users'
    locationLabel = c('Label').t`Shared with me`
  } else if (location?.type === 'root') {
    locationIcon = 'inbox'
    locationLabel = c('Label').t`My files`
  } else {
    locationIcon = 'folder'
    locationLabel = location?.path.at(-1)!
  }
  let locationContent = (
    <Button
      onClick={(event) => {
        event.stopPropagation()
        handleOpenFolder(recentDocument)
      }}
      shape="ghost"
      className="text-pre flex items-center text-ellipsis px-2"
    >
      <Icon className="mr-2" name={locationIcon} />
      {locationLabel}
    </Button>
  )
  if (location?.type === 'path') {
    locationContent = <Tooltip title={location?.path?.join(' / ')}>{locationContent}</Tooltip>
  }

  const contextMenu = useContextMenu()

  return (
    <Table.Row
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
      <Table.DataCell>
        <span className="flex items-center gap-3">
          <Icon name="brand-proton-docs" size={5} className="text-[#34B8EE]" />
          <span className="text-pre text-ellipsis font-medium">{recentDocument.name}</span>
          {/* {
            recentDocument.whatever || recentDocument.isFavorite ? (
                <div className="flex gap-[.625rem] text-[--text-weak]"> */}
          {/* TODO: implement shared with others & public (globe icon in that case), tooltips: "Shared" & "Public" */}
          {/* {recentDocument.whatever ? <Icon name="users" size={5} /> : null} */}
          {/* TODO: implement favorites */}
          {/* {recentDocument.isFavorite ? <Icon name="star" size={5} /> : null} */}
          {/* </div>
            ) : null
          } */}
        </span>
      </Table.DataCell>

      <Table.DataCell>
        <span className="capitalize">{getDisplayDate(recentDocument)}</span>
      </Table.DataCell>

      <Table.DataCell hideOnSmallDevices>
        <span className="flex items-center gap-2">
          {recentDocument.isSharedWithMe && (
            <Avatar
              color="weak"
              className="min-w-custom max-w-custom max-h-custom"
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
      </Table.DataCell>

      <Table.DataCell hideOnSmallDevices>
        <div className="flex flex-nowrap">
          {locationContent}
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
      </Table.DataCell>
    </Table.Row>
  )
}
