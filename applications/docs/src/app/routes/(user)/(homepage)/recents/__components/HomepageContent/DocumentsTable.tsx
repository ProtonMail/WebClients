import { useDocumentActions } from '../../__utils/document-actions'
import type { ReactNode } from 'react'
import { Fragment, useRef } from 'react'
import { DocContextMenu } from './DocContextMenu/DocContextMenu'
import { useContextMenu } from './DocContextMenu/context'
import * as Table from './table'
import { DateFormatter, type RecentDocumentsItem } from '@proton/docs-core'
import type { IconName } from '@proton/components'
import {
  Dropdown,
  DropdownMenu,
  DropdownMenuButton,
  Icon,
  Tooltip,
  useAuthentication,
  usePopperAnchor,
} from '@proton/components'
import { c } from 'ttag'
import { Avatar, Button } from '@proton/atoms'
import { getInitials } from '@proton/shared/lib/helpers/string'
import clsx from '@proton/utils/clsx'
import type { ContactEmail } from '@proton/shared/lib/interfaces/contacts'
import { useContactEmails } from '@proton/mail/contactEmails/hooks'
import { getAppHref } from '@proton/shared/lib/apps/helper'
import { APPS } from '@proton/shared/lib/constants'
import type { RecentsSort } from '../../__utils/homepage-view'
import { useHomepageView, type ItemsSection, type ItemsSectionId } from '../../__utils/homepage-view'
import { ContentSheet } from './shared'

// table
// -----

export type TableVariant = 'recents-name' | 'recents-viewed' | 'recents-modified' | 'trashed' | 'search'
export type DocumentsTableProps = { itemsSections: ItemsSection[]; variant: TableVariant }

export function DocumentsTable({ itemsSections, variant }: DocumentsTableProps) {
  const contextMenuAnchorRef = useRef<HTMLDivElement>(null)
  const contextMenu = useContextMenu()

  return (
    <>
      <ContentSheet className="grow overflow-auto rounded-b-none pb-4">
        <table className="mb-0 w-full table-fixed text-[14px]">
          {itemsSections.map(({ id, items }, sectionIndex) => (
            <Fragment key={id}>
              <Head variant={variant} sectionId={id} isSecondary={sectionIndex > 0} />
              <Body variant={variant} items={items} />
            </Fragment>
          ))}
        </table>
      </ContentSheet>
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

// head
// ----

type HeadProps = { sectionId: ItemsSectionId; isSecondary?: boolean; variant: TableVariant }

function Head({ isSecondary = false, sectionId, variant }: HeadProps) {
  const firstHeaderShowArrow = !isSecondary && (variant === 'recents-name' || variant === 'trashed')

  let secondHeaderLabel = c('Recent documents table header').t`Viewed`
  if (variant === 'recents-modified') {
    secondHeaderLabel = c('Recent documents table header').t`Modified`
  }
  if (variant === 'trashed') {
    secondHeaderLabel = c('Recent documents table header').t`Deleted`
  }
  const secondHeaderShowArrow = variant === 'recents-viewed' || variant === 'recents-modified'

  const isRecents = variant.startsWith('recents')

  return (
    <Table.Head>
      <Table.Header colSpan={!isSecondary ? undefined : 4}>
        <span className="flex flex-nowrap items-center gap-[.375rem]">
          <span>{getSectionLabel(sectionId)}</span>
          {firstHeaderShowArrow ? <Icon name="arrow-down" size={4} className="text-[--icon-norm]" /> : null}
        </span>
      </Table.Header>
      {!isSecondary ? (
        <>
          <Table.Header>
            <span className="flex flex-nowrap items-center gap-[.375rem]">
              <span>{secondHeaderLabel}</span>
              {secondHeaderShowArrow ? <Icon name="arrow-down" size={4} className="text-[--icon-norm]" /> : null}
            </span>
          </Table.Header>
          <Table.Header>{c('Recent documents table header').t`Created by`}</Table.Header>
          <Table.Header>
            <div className="flex flex-nowrap items-center justify-between">
              <span>{c('Recent documents table header').t`Location`}</span>
              {isRecents ? <SortSelect /> : null}
            </div>
          </Table.Header>
        </>
      ) : null}
    </Table.Head>
  )
}

const SORT_SELECT_OPTIONS = [
  { value: 'viewed', label: () => c('Actions').t`Last viewed first` },
  // TODO: re-enable once "last modified" is supported.
  // { value: 'modified', label: () => c('Actions').t`Last modified first` },
  { value: 'name', label: () => c('Actions').t`Name` },
] satisfies { value: RecentsSort; label: () => string }[]

function SortSelect() {
  const { anchorRef, isOpen, toggle, close } = usePopperAnchor<HTMLButtonElement>()
  const { state, setRecentsSort } = useHomepageView()
  const sortValue = state.view === 'recents' ? state.sort : undefined

  return (
    <>
      <Button
        icon
        onClick={toggle}
        aria-label="Change sort order"
        ref={anchorRef}
        shape="ghost"
        className={clsx('ml-auto shrink-0 px-2', isOpen && '!bg-[--button-active-background-color]')}
      >
        <Icon name="arrow-down-arrow-up" className="shrink-0" />
      </Button>
      <Dropdown isOpen={isOpen} anchorRef={anchorRef} onClose={close}>
        <DropdownMenu>
          <p className="px-4 py-2 text-[.875rem] font-bold">Sort by</p>
          {SORT_SELECT_OPTIONS.map(({ label, value }) => (
            <DropdownMenuButton
              key={value}
              onClick={() => {
                setRecentsSort(value)
                close()
              }}
              className="flex items-center gap-2"
            >
              <span>{label()}</span>
              {sortValue === value ? <Icon name="checkmark" /> : null}
            </DropdownMenuButton>
          ))}
        </DropdownMenu>
      </Dropdown>
    </>
  )
}

function getSectionLabel(id: ItemsSectionId): string {
  switch (id) {
    case 'name':
      return c('Recent documents table header').t`Name`
    case 'today':
      return c('Recent documents table header').t`Today`
    case 'yesterday':
      return c('Recent documents table header').t`Yesterday`
    case 'previous7Days':
      return c('Recent documents table header').t`Previous 7 days`
    case 'previous30Days':
      return c('Recent documents table header').t`Previous 30 days`
    case 'earlier':
      return c('Recent documents table header').t`Earlier`
  }
}

// body
// ----

type BodyProps = { items: RecentDocumentsItem[]; variant: TableVariant }

function Body({ items, variant }: BodyProps) {
  return (
    <tbody className="divide-y divide-[--border-weak] overflow-scroll">
      {items.map((recentDocument) => (
        <Row variant={variant} key={recentDocument.uniqueId()} document={recentDocument} />
      ))}
    </tbody>
  )
}

// row
// ---

type RowProps = { document: RecentDocumentsItem; variant: TableVariant }

function Row({ document, variant }: RowProps) {
  const { getLocalID } = useAuthentication()
  const documentActions = useDocumentActions()
  const { location } = document
  const displayName = useOwnerName(document)

  if (!location) {
    throw new Error('Unexpected missing location')
  }

  let locationIcon: IconName
  let locationLabel: string
  if (variant === 'trashed') {
    locationIcon = 'trash'
    locationLabel = c('Label').t`Trash`
  } else if (location?.type === 'shared-with-me') {
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
        if (variant === 'trashed') {
          window.open(getAppHref('/trash', APPS.PROTONDRIVE, getLocalID()))
        } else {
          documentActions.openParent(document)
        }
      }}
      shape="ghost"
      className="text-pre flex flex-nowrap items-center text-ellipsis px-2"
    >
      <Icon className="mr-2 shrink-0" name={locationIcon} />
      {locationLabel}
    </Button>
  )
  if (location?.type === 'path') {
    locationContent = <Tooltip title={location?.path?.join(' / ')}>{locationContent}</Tooltip>
  }

  const contextMenu = useContextMenu()

  let avatarContent: ReactNode = <Icon name="user-filled" className="shrink-0" />
  if (document.isSharedWithMe) {
    if (!document.createdBy) {
      avatarContent = <Icon name="user" className="shrink-0" />
    } else {
      avatarContent = getInitials(document.createdBy)
    }
  }

  const isRecents = variant.startsWith('recents')

  return (
    <Table.Row
      className="cursor-pointer hover:bg-[--interaction-default-hover]"
      onClick={(event) => {
        event.stopPropagation()
        documentActions.open(document)
      }}
      onContextMenu={(event) => {
        if (variant === 'trashed') {
          return
        }
        event.stopPropagation()
        contextMenu.setCurrentDocument(document)
        contextMenu.handleContextMenu(event)
      }}
    >
      <Table.DataCell>
        <span className="flex flex-nowrap items-center gap-3">
          <Icon name="brand-proton-docs" size={5} className="shrink-0 text-[#34B8EE]" />
          <span className="text-pre text-ellipsis font-medium">{document.name}</span>
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
        <span className="capitalize">{getRelativeDate(document)}</span>
      </Table.DataCell>

      <Table.DataCell hideOnSmallDevices>
        <span className="flex flex-nowrap items-center gap-2">
          <Avatar
            color="weak"
            className="min-w-custom max-w-custom max-h-custom bg-[#F6F4F2]"
            style={{
              '--min-w-custom': '28px',
              '--max-w-custom': '28px',
              '--max-h-custom': '28px',
            }}
          >
            {avatarContent}
          </Avatar>
          <span className="text-pre flex-1 text-ellipsis">{displayName}</span>
        </span>
      </Table.DataCell>

      <Table.DataCell hideOnSmallDevices>
        <div className="-ms-2 flex flex-nowrap">
          {locationContent}
          {isRecents ? (
            <Button
              onClick={(event) => {
                event.stopPropagation()
                contextMenu.setCurrentDocument(document)
                contextMenu.handleContextMenu(event)
              }}
              shape="ghost"
              className="ml-auto shrink-0 px-2"
              aria-label={c('Action').t`Context menu`}
            >
              <Icon name="three-dots-vertical" />
            </Button>
          ) : null}
        </div>
      </Table.DataCell>
    </Table.Row>
  )
}

// utils
// -----

export function getOwnerName(recentDocument: RecentDocumentsItem, contactEmails?: ContactEmail[]) {
  if (!recentDocument.isSharedWithMe) {
    return c('Info').t`Me`
  }

  if (!recentDocument.createdBy) {
    return undefined
  }

  const foundContact = contactEmails?.find((contactEmail) => contactEmail.Email === recentDocument.createdBy)

  if (foundContact) {
    return foundContact.Name ?? foundContact.Email
  }

  return recentDocument.createdBy
}

export function useOwnerName(recentDocument: RecentDocumentsItem) {
  const [contactEmails] = useContactEmails()
  return getOwnerName(recentDocument, contactEmails)
}

const dateFormatter = new DateFormatter()

function getRelativeDate({ lastViewed }: RecentDocumentsItem): string {
  return dateFormatter.formatDate(lastViewed.date)
}
