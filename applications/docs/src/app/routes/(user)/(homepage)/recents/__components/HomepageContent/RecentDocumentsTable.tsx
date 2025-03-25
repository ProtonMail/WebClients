import { useRecentDocuments } from '../../__utils/recent-documents'
import type { Dispatch, ReactNode, SetStateAction } from 'react'
import { createContext, Fragment, useContext, useMemo, useRef, useState } from 'react'
import { DocContextMenu } from './DocContextMenu/DocContextMenu'
import { useContextMenu } from './DocContextMenu/context'
import * as Table from './table'
import { DateFormatter, type RecentDocumentsItem } from '@proton/docs-core'
import type { IconName } from '@proton/components'
import { Dropdown, DropdownMenu, DropdownMenuButton, Icon, Tooltip, usePopperAnchor } from '@proton/components'
import { c } from 'ttag'
import { Avatar, Button } from '@proton/atoms'
import { getInitials } from '@proton/shared/lib/helpers/string'
import clsx from '@proton/utils/clsx'
import type { ContactEmail } from '@proton/shared/lib/interfaces/contacts'
import { useContactEmails } from '@proton/mail/contactEmails/hooks'

// table
// -----

export function RecentDocumentsTable() {
  const contextMenuAnchorRef = useRef<HTMLDivElement>(null)
  const contextMenu = useContextMenu()

  return (
    <ItemsProvider>
      <RecentDocumentsTableContent />
      <DocContextMenu
        currentDocument={contextMenu.currentDocument}
        anchorRef={contextMenuAnchorRef}
        close={contextMenu.close}
        isOpen={contextMenu.isOpen}
        open={contextMenu.open}
        position={contextMenu.position}
      />
    </ItemsProvider>
  )
}

function getSectionLabel(id: ItemSectionId): string {
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

function RecentDocumentsTableContent() {
  const { itemSections } = useItems()
  return (
    <table className="w-full table-fixed text-[14px]">
      {itemSections.map(({ id, items }, sectionIndex) => (
        <Fragment key={id}>
          <Head label={getSectionLabel(id)} isSecondary={sectionIndex > 0} />
          <Body items={items} />
        </Fragment>
      ))}
    </table>
  )
}

// items context
// -------------

type Sort = 'viewed' | 'modified' | 'name'
const ORDERED_SECTION_IDS = ['name', 'today', 'yesterday', 'previous7Days', 'previous30Days', 'earlier'] as const
export type ItemSectionId = (typeof ORDERED_SECTION_IDS)[number]
type ItemSection = { id: ItemSectionId; items: RecentDocumentsItem[] }
type ItemSections = ItemSection[]
type ItemsContextValue = {
  sort: Sort
  setSort: Dispatch<SetStateAction<Sort>>
  itemSections: ItemSections
}

const ItemsContext = createContext<ItemsContextValue | undefined>(undefined)

function ItemsProvider({ children }: { children: ReactNode }) {
  const [sort, setSort] = useState<Sort>('viewed')
  const { items } = useRecentDocuments()
  const itemSections = useMemo((): ItemSections => {
    if (sort === 'name') {
      return [{ id: 'name', items: items.sort((a, b) => a.name.localeCompare(b.name)) }]
    } else {
      return splitIntoSections(items, sort === 'viewed' ? 'lastViewed' : 'lastModified')
    }
  }, [items, sort])
  return <ItemsContext.Provider value={{ sort, setSort, itemSections }}>{children}</ItemsContext.Provider>
}

function useItems() {
  const context = useContext(ItemsContext)
  if (!context) {
    throw new Error('Missing ItemsContext provider')
  }
  return context
}

export function splitIntoSections(items: RecentDocumentsItem[], property: 'lastViewed' | 'lastModified'): ItemSections {
  const sections: ItemSections = []

  const TODAY = new Date()
  TODAY.setHours(0, 0, 0, 0)
  const YESTERDAY = new Date(TODAY)
  YESTERDAY.setDate(YESTERDAY.getDate() - 1)
  const PREVIOUS_7_DAYS = new Date(TODAY)
  PREVIOUS_7_DAYS.setDate(PREVIOUS_7_DAYS.getDate() - 7)
  const PREVIOUS_30_DAYS = new Date(TODAY)
  PREVIOUS_30_DAYS.setDate(PREVIOUS_30_DAYS.getDate() - 30)

  function sort(a: RecentDocumentsItem, b: RecentDocumentsItem) {
    return sortByMostRecent(a, b, property)
  }

  const sectionMap: Partial<Record<ItemSectionId, ItemSection>> = {}
  function getSection(name: ItemSectionId) {
    if (!sectionMap[name]) {
      sectionMap[name] = { id: name, items: [] }
    }
    return sectionMap[name]
  }

  for (const item of items.sort(sort)) {
    const itemDate = item[property].date
    if (isAfter(itemDate, TODAY)) {
      getSection('today').items.push(item)
    } else if (isAfter(itemDate, YESTERDAY)) {
      getSection('yesterday').items.push(item)
    } else if (isAfter(itemDate, PREVIOUS_7_DAYS)) {
      getSection('previous7Days').items.push(item)
    } else if (isAfter(itemDate, PREVIOUS_30_DAYS)) {
      getSection('previous30Days').items.push(item)
    } else {
      getSection('earlier').items.push(item)
    }
  }

  for (const sectionId of ORDERED_SECTION_IDS) {
    if (sectionMap[sectionId]) {
      sections.push(sectionMap[sectionId]!)
    }
  }

  return sections
}

function isAfter(date: Date, target: Date) {
  return date.getTime() >= target.getTime()
}

function sortByMostRecent(a: RecentDocumentsItem, b: RecentDocumentsItem, property: 'lastViewed' | 'lastModified') {
  return b[property].date.getTime() - a[property].date.getTime()
}

// head
// ----

const VIEWED_LABEL = c('Recent documents table header').t`Viewed`

type HeadProps = { isSecondary?: boolean; label: ReactNode }

function Head({ isSecondary = false, label }: HeadProps) {
  const { sort } = useItems()

  let secondHeaderContent: ReactNode
  if (sort === 'modified' || sort === 'viewed') {
    secondHeaderContent = (
      <span className="flex items-center gap-[6px]">
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
          <Table.Header>
            <div className="flex items-center justify-between">
              <span>{c('Recent documents table header').t`Location`}</span>
              <SortSelect />
            </div>
          </Table.Header>
        </>
      ) : null}
    </Table.Head>
  )
}

const SORT_SELECT_OPTIONS = [
  { label: c('Actions').t`Last viewed first`, value: 'viewed' },
  { label: c('Actions').t`Last modified first`, value: 'modified' },
  { label: c('Actions').t`Name`, value: 'name' },
]

function SortSelect() {
  const { sort, setSort } = useItems()
  const { anchorRef, isOpen, toggle, close } = usePopperAnchor<HTMLButtonElement>()

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
        <Icon name="arrow-down-arrow-up" />
      </Button>
      <Dropdown isOpen={isOpen} anchorRef={anchorRef} onClose={close}>
        <DropdownMenu>
          <p className="px-4 py-2 text-[.875rem] font-bold">Sort by</p>
          {SORT_SELECT_OPTIONS.map(({ label, value }) => (
            <DropdownMenuButton
              key={value}
              onClick={() => {
                setSort(value as Sort)
                close()
              }}
              className="flex items-center gap-2"
            >
              <span>{label}</span>
              {sort === value ? <Icon name="checkmark" /> : null}
            </DropdownMenuButton>
          ))}
        </DropdownMenu>
      </Dropdown>
    </>
  )
}

// body
// ----

type BodyProps = { items: RecentDocumentsItem[] }

function Body({ items }: BodyProps) {
  return (
    <tbody className="divide-y divide-[--border-weak] overflow-scroll">
      {items.map((recentDocument) => (
        <Row key={recentDocument.uniqueId()} document={recentDocument} />
      ))}
    </tbody>
  )
}

// row
// ---

type RowProps = { document: RecentDocumentsItem }

function Row({ document }: RowProps) {
  const { handleOpenDocument, handleOpenFolder } = useRecentDocuments()
  const { location } = document
  const displayName = useOwnerName(document)

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
        handleOpenFolder(document)
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

  let avatarContent: ReactNode = <Icon name="user-filled" />
  if (document.isSharedWithMe) {
    if (!document.createdBy) {
      avatarContent = <Icon name="user" />
    } else {
      avatarContent = getInitials(document.createdBy)
    }
  }

  return (
    <Table.Row
      className="cursor-pointer hover:bg-[--interaction-default-hover]"
      onClick={(event) => {
        event.stopPropagation()
        handleOpenDocument(document)
      }}
      onContextMenu={(event) => {
        event.stopPropagation()
        contextMenu.setCurrentDocument(document)
        contextMenu.handleContextMenu(event)
      }}
    >
      <Table.DataCell>
        <span className="flex items-center gap-3">
          <Icon name="brand-proton-docs" size={5} className="text-[#34B8EE]" />
          <span className="text-pre text-ellipsis font-medium">{document.name}</span>
          {/* {
            recentDocument.whatever || recentDocument.isFavorite ? (
                <div className="flex gap-[10px] text-[--text-weak]"> */}
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
        <span className="flex items-center gap-2">
          <Avatar
            color="weak"
            className="min-w-custom max-w-custom max-h-custom"
            style={{
              '--min-w-custom': '28px',
              '--max-w-custom': '28px',
              '--max-h-custom': '28px',
            }}
          >
            {
              <Avatar
                color="weak"
                className="min-w-custom max-w-custom max-h-custom"
                style={{
                  '--min-w-custom': '28px',
                  '--max-w-custom': '28px',
                  '--max-h-custom': '28px',
                }}
              >
                {avatarContent}
              </Avatar>
            }
          </Avatar>
          <span className="text-pre flex-1 text-ellipsis">{displayName}</span>
        </span>
      </Table.DataCell>

      <Table.DataCell hideOnSmallDevices>
        <div className="-ms-2 flex flex-nowrap">
          {locationContent}
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
