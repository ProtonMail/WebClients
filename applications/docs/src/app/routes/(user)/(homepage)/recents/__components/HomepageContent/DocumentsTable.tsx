import { useDocumentActions } from '../../__utils/document-actions'
import type { ReactNode } from 'react'
import { Fragment, useEffect, useRef, useState } from 'react'
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
import { Avatar, Button, Input } from '@proton/atoms'
import { getInitials } from '@proton/shared/lib/helpers/string'
import clsx from '@proton/utils/clsx'
import type { ContactEmail } from '@proton/shared/lib/interfaces/contacts'
import { useContactEmails } from '@proton/mail/contactEmails/hooks'
import { getAppHref } from '@proton/shared/lib/apps/helper'
import { APPS } from '@proton/shared/lib/constants'
import type { RecentsSort } from '../../__utils/homepage-view'
import { useHomepageView, type ItemsSection, type ItemsSectionId } from '../../__utils/homepage-view'
import { ContentSheet } from './shared'
import { useApplication } from '~/utils/application-context'
import { TelemetryDocsHomepageEvents } from '@proton/shared/lib/api/telemetry'

// table
// -----

export type TableVariant = 'recents-name' | 'recents-viewed' | 'recents-modified' | 'trash' | 'search'
export type DocumentsTableProps = { itemsSections: ItemsSection[]; variant: TableVariant }

export function DocumentsTable({ itemsSections, variant }: DocumentsTableProps) {
  const contextMenuAnchorRef = useRef<HTMLDivElement>(null)
  const contextMenu = useContextMenu()
  const isRecents = variant.startsWith('recents')
  const isSearch = variant === 'search'

  return (
    <>
      <ContentSheet isBottom className="shrink-0 grow pb-4">
        <Table.Table>
          <Table.Title>
            {isRecents || isSearch ? c('Info').t`Recents` : c('Info').t`Trash`}
            {isRecents && <SortSelect />}
          </Table.Title>
          {itemsSections.map(({ id, items }, sectionIndex) => (
            <Fragment key={id}>
              <Head variant={variant} sectionId={id} isSecondary={sectionIndex > 0} />
              <Body variant={variant} items={items} />
            </Fragment>
          ))}
        </Table.Table>
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
  const firstHeaderShowArrow = !isSecondary && (variant === 'recents-name' || variant === 'trash')

  let secondHeaderLabel = c('Recent documents table header').t`Viewed`
  if (variant === 'recents-modified') {
    secondHeaderLabel = c('Recent documents table header').t`Modified`
  }
  if (variant === 'trash') {
    secondHeaderLabel = c('Recent documents table header').t`Deleted`
  }
  const secondHeaderShowArrow = variant === 'recents-viewed' || variant === 'recents-modified'

  return (
    <Table.Head secondarySticky>
      <Table.Header>
        <div className="flex items-center justify-between">
          <span className="flex flex-nowrap items-center gap-[.375rem]">
            <span>{getSectionLabel(sectionId)}</span>
            {firstHeaderShowArrow ? <Icon name="arrow-down" size={4} className="text-[--icon-norm]" /> : null}
          </span>
        </div>
      </Table.Header>
      {!isSecondary ? (
        <>
          <Table.Header target="large">
            <span className="flex flex-nowrap items-center gap-[.375rem]">
              <span>{secondHeaderLabel}</span>
              {secondHeaderShowArrow ? <Icon name="arrow-down" size={4} className="text-[--icon-norm]" /> : null}
            </span>
          </Table.Header>
          <Table.Header target="medium">{c('Recent documents table header').t`Created by`}</Table.Header>
          <Table.Header target="medium">
            <div className="flex flex-nowrap items-center justify-between">
              <span>{c('Recent documents table header').t`Location`}</span>
            </div>
          </Table.Header>
        </>
      ) : (
        // This could probably be achieved in a cleaner way, but due to time constraints, we
        // resort to this hack to ensure proper sizing of the main column header, so that other
        // previously stickied column headers are not obscured by it.
        <>
          <Table.DataCell className="pointer-events-none opacity-0"></Table.DataCell>
          <Table.DataCell className="pointer-events-none opacity-0"></Table.DataCell>
          <Table.DataCell className="pointer-events-none opacity-0"></Table.DataCell>
        </>
      )}
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
  const application = useApplication()
  const { anchorRef, isOpen, toggle, close } = usePopperAnchor<HTMLButtonElement>()
  const { state, setRecentsSort } = useHomepageView()
  const sortValue = state.view === 'recents' ? state.sort : undefined

  return (
    <>
      <Tooltip title={c('Action').t`Sort by`}>
        <Button
          icon
          onClick={toggle}
          aria-label={c('Action').t`Change sort order`}
          ref={anchorRef}
          shape="ghost"
          className={clsx('ml-auto shrink-0 px-2', isOpen && '!bg-[--button-active-background-color]')}
        >
          <Icon name="arrow-down-arrow-up" className="shrink-0" />
        </Button>
      </Tooltip>
      <Dropdown isOpen={isOpen} anchorRef={anchorRef} onClose={close}>
        <DropdownMenu>
          <p className="px-4 py-2 text-[.875rem] font-bold">Sort by</p>
          {SORT_SELECT_OPTIONS.map(({ label, value }) => (
            <DropdownMenuButton
              key={value}
              onClick={() => {
                setRecentsSort(value)
                close()
                application.metrics.reportHomepageTelemetry(
                  TelemetryDocsHomepageEvents[value === 'name' ? 'sorting_changed_to_name' : 'sorting_changed_to_time'],
                )
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
    case 'search-results':
      return c('Recent documents table header').t`Search results`
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
    <Table.Body className="divide-weak divide-y">
      {items.map((recentDocument) => (
        <Row variant={variant} key={recentDocument.uniqueId()} document={recentDocument} />
      ))}
    </Table.Body>
  )
}

// row
// ---

// Refresh dates every minute.
const REFRESH_DATE_INTERVAL = 1000 * 60 // ms

type RowProps = { document: RecentDocumentsItem; variant: TableVariant }

function Row({ document, variant }: RowProps) {
  const { getLocalID } = useAuthentication()
  const documentActions = useDocumentActions()
  const { location } = document
  const displayName = useOwnerName(document)
  const { updateRenamedDocumentInCache } = useHomepageView()

  // Force re-render every REFRESH_DATE_INTERVAL milliseconds
  const [, setState] = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval>>()
  useEffect(() => {
    intervalRef.current = setInterval(() => setState((prev) => !prev), REFRESH_DATE_INTERVAL)
    return () => clearInterval(intervalRef.current)
  }, [])

  if (!location) {
    throw new Error('Unexpected missing location')
  }

  let locationIcon: IconName
  let locationLabel: string
  if (variant === 'trash') {
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
  const isLocationPath = location?.type === 'path'
  let locationContent = (
    <Button
      onClick={(event) => {
        event.stopPropagation()
        if (variant === 'trash') {
          window.open(getAppHref('/trash', APPS.PROTONDRIVE, getLocalID()))
        } else {
          documentActions.openParent(document)
        }
      }}
      shape="ghost"
      className="text-pre flex flex-nowrap items-center px-2"
      title={!isLocationPath ? locationLabel : undefined}
    >
      <Icon className="mr-2 shrink-0" name={locationIcon} />
      <span className="overflow-hidden text-ellipsis">{locationLabel}</span>
    </Button>
  )
  if (isLocationPath) {
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
  const isSearch = variant === 'search'

  const isRenaming = documentActions.isRenaming(document)

  return (
    <Table.Row
      className="cursor-pointer hover:bg-[--optional-background-lowered]"
      onClick={(event) => {
        event.stopPropagation()
        documentActions.open(document)
      }}
      onContextMenu={(event) => {
        if (variant === 'trash') {
          return
        }
        event.stopPropagation()
        contextMenu.setCurrentDocument(document)
        contextMenu.handleContextMenu(event)
      }}
    >
      <Table.DataCell>
        <span title={document.name} className="flex flex-nowrap items-center gap-3">
          <Icon name="brand-proton-docs" size={5} className="shrink-0 text-[#34B8EE]" />
          {isRenaming ? (
            <Input
              ref={(element) => {
                element?.select()
              }}
              defaultValue={document.name}
              onClick={(event) => event.stopPropagation()}
              disabled={documentActions.isRenameSaving}
              onKeyDown={async (event) => {
                if (event.key === 'Enter') {
                  const { value } = event.currentTarget
                  await documentActions.rename(document, value)
                  await updateRenamedDocumentInCache(document.uniqueId(), value)
                }
                if (event.key === 'Escape') {
                  if (documentActions.isRenameSaving) {
                    return
                  }
                  documentActions.cancelRename()
                }
              }}
              onBlur={() => {
                if (documentActions.isRenameSaving) {
                  return
                }
                documentActions.cancelRename()
              }}
            />
          ) : (
            <span className="text-pre text-ellipsis">{document.name}</span>
          )}
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

      <Table.DataCell target="large">
        <span title={getRelativeDate(document)}>{getRelativeDate(document)}</span>
      </Table.DataCell>

      <Table.DataCell target="medium">
        <span className="flex flex-nowrap items-center gap-2" title={displayName}>
          <Avatar
            color="weak"
            className="min-w-custom max-w-custom max-h-custom bg-[--interaction-default-hover]"
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

      <Table.DataCell target="medium">
        <div className="-ms-2 flex w-full flex-nowrap justify-between">
          {locationContent}
          {isRecents || isSearch ? (
            <Tooltip title={c('Action').t`Actions`}>
              <Button
                onClick={(event) => {
                  event.stopPropagation()
                  contextMenu.setCurrentDocument(document)
                  contextMenu.handleContextMenu(event)
                }}
                shape="ghost"
                className="ml-auto shrink-0 px-2"
                aria-label={c('Action').t`Actions`}
              >
                <Icon name="three-dots-vertical" />
              </Button>
            </Tooltip>
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
  const text = dateFormatter.formatDateOrTimeIfToday(lastViewed.date, c('Info').t`Just now`)
  return text.charAt(0).toUpperCase() + text.slice(1)
}
