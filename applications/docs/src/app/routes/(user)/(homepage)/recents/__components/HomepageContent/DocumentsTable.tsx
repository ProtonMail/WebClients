import { useAddresses } from '@proton/account/addresses/hooks'
import { useNotifications } from '@proton/app-context/useNotifications'
import { Avatar } from '@proton/atoms/Avatar/Avatar'
import { Button } from '@proton/atoms/Button/Button'
import { Input } from '@proton/atoms/Input/Input'
import { usePopperAnchor } from '@proton/atoms/Popper/usePopperAnchor'
import { Tooltip } from '@proton/atoms/Tooltip/Tooltip'
import Dropdown from '@proton/components/components/dropdown/Dropdown'
import DropdownMenu from '@proton/components/components/dropdown/DropdownMenu'
import DropdownMenuButton from '@proton/components/components/dropdown/DropdownMenuButton'
import Checkbox from '@proton/components/components/input/Checkbox'
import useActiveBreakpoint from '@proton/components/hooks/useActiveBreakpoint'
import useAuthentication from '@proton/components/hooks/useAuthentication'
import type { RecentDocumentsItem } from '@proton/docs-core/Services/recent-documents'
import { DateFormatter } from '@proton/docs-core/VersionHistory/DateFormatter'
import type { IconComponent } from '@proton/icons/component'
import { IcArrowDown } from '@proton/icons/icons/IcArrowDown'
import { IcArrowDownArrowUp } from '@proton/icons/icons/IcArrowDownArrowUp'
import { IcCheckmark } from '@proton/icons/icons/IcCheckmark'
import { IcFolder } from '@proton/icons/icons/IcFolder'
import { IcInbox } from '@proton/icons/icons/IcInbox'
import { IcThreeDotsVertical } from '@proton/icons/icons/IcThreeDotsVertical'
import { IcTrash } from '@proton/icons/icons/IcTrash'
import { IcUser } from '@proton/icons/icons/IcUser'
import { IcUserFilled } from '@proton/icons/icons/IcUserFilled'
import { IcUsers } from '@proton/icons/icons/IcUsers'
import { useContactEmails } from '@proton/mail/store/contactEmails/hooks'
import { TelemetryDocsHomepageEvents } from '@proton/shared/lib/api/telemetry'
import { getAppHref } from '@proton/shared/lib/apps/helper'
import { APPS } from '@proton/shared/lib/constants'
import type { ProtonDocumentType } from '@proton/shared/lib/helpers/mimetype'
import { SentryRealtimeInitiatives, traceError } from '@proton/shared/lib/helpers/sentry'
import { getInitials } from '@proton/shared/lib/helpers/string'
import type { Address } from '@proton/shared/lib/interfaces/Address'
import clsx from '@proton/utils/clsx'
import type { ComponentPropsWithoutRef, KeyboardEvent, MouseEvent, ReactNode } from 'react'
import { Fragment, useEffect, useRef, useState } from 'react'
import { c, msgid } from 'ttag'
import { useApplication } from '~/utils/application-context'
import { useBulkTrashEnabled } from '~/utils/flags'
import { useDocumentActions } from '../../__utils/document-actions'
import { getOwnerName } from '../../__utils/get-owner-name'
import type { RecentsSort } from '../../__utils/homepage-view'
import { useHomepageView, type ItemsSection, type ItemsSectionId } from '../../__utils/homepage-view'
import { isMyDocument } from '../../__utils/is-my-document'
import { useBulkTrash } from '../../__utils/useBulkTrash'
import { useDoubleClick } from '../../__utils/useDoubleClick'
import { useRowSelection, type RowSelection } from '../../__utils/useRowSelection'
import { DocContextMenu, useCanTrash } from './DocContextMenu/DocContextMenu'
import { useContextMenu } from './DocContextMenu/context'
import { COLOR_BY_TYPE, ContentSheet, ICON_BY_TYPE } from './shared'
import * as Table from './table'

// table
// -----

export type TableVariant =
  'recents-name' | 'recents-viewed' | 'recents-modified' | 'recents-owner' | 'recents-location' | 'trash' | 'search'
export type DocumentsTableProps = { itemsSections: ItemsSection[]; variant: TableVariant }

export function DocumentsTable({ itemsSections, variant }: DocumentsTableProps) {
  const [addresses] = useAddresses()
  const { type, state } = useHomepageView()
  const contextMenuAnchorRef = useRef<HTMLDivElement>(null)
  const contextMenu = useContextMenu()
  const isRecents = variant.startsWith('recents')
  const isSearch = variant === 'search'

  // Like Drive: single click selects, double click opens.
  const openOnDoubleClick = useBulkTrashEnabled()
  const bulkEnabled = openOnDoubleClick && (isRecents || isSearch)
  const canTrash = useCanTrash()
  const allItems = itemsSections.flatMap(({ items }) => items)
  const selectableIds = bulkEnabled ? allItems.filter(canTrash).map((item) => item.uniqueId()) : []
  const selectableIdsSet = new Set(selectableIds)
  const resetKey = `${state.view}|${'query' in state ? state.query : ''}|${type}`
  const selection = useRowSelection(selectableIds, resetKey)
  const { trash, isTrashing } = useBulkTrash()
  const hasSelection = selection.selectedIds.length > 0
  // The title is hidden on mobile, so the selection controls move to the head, like in Drive.
  const isNarrow = useActiveBreakpoint().viewportWidth['<=small']
  const hasSelectionControls = selectableIds.length > 0

  const label = isRecents || isSearch ? recentsLabelByType(type) : c('Info').t`Trash`
  const bulkTrashButton = (
    <BulkTrashButton
      selection={selection}
      documents={allItems.filter((item) => selection.isSelected(item.uniqueId()))}
      trash={trash}
      isTrashing={isTrashing}
    />
  )

  return (
    <>
      <ContentSheet
        isBottom
        className="shrink-0 grow pb-4"
        onClick={(event) => {
          // Skips rows (their activator is a button). `contains` skips clicks bubbling from portals (e.g. modals).
          const { target, currentTarget } = event
          if (target instanceof Element && currentTarget.contains(target) && !target.closest('button, input, label')) {
            selection.clear()
          }
        }}
      >
        <Table.Table
          onKeyDown={(event) => {
            // Leave the rename input alone.
            const { target } = event
            if (target instanceof HTMLInputElement && target.type !== 'checkbox') {
              return
            }
            if (event.key === 'Escape') {
              selection.clear()
            } else {
              moveRowFocus(event)
            }
          }}
        >
          <Table.Title topLevelSticky>
            {hasSelectionControls && !isNarrow ? (
              <SelectionLabel selection={selection} isTrashing={isTrashing} label={label} />
            ) : (
              label
            )}
            {hasSelection && !isNarrow ? bulkTrashButton : isRecents && <SortSelect />}
          </Table.Title>
          <Head
            variant={variant}
            sectionId={itemsSections[0].id}
            hasCheckbox={bulkEnabled}
            selectionControls={
              hasSelectionControls && isNarrow ? (
                <div className="flex w-full items-center">
                  <SelectionLabel
                    selection={selection}
                    isTrashing={isTrashing}
                    label={getSectionLabel(itemsSections[0].id)}
                  />
                  {hasSelection && bulkTrashButton}
                </div>
              ) : undefined
            }
          />
          {itemsSections.map(({ id, items }, sectionIndex) => (
            <Fragment key={id}>
              {sectionIndex > 0 && <SectionLabel sectionId={id} hasCheckbox={bulkEnabled} />}
              <Body
                variant={variant}
                items={items}
                addresses={addresses}
                selection={bulkEnabled ? selection : undefined}
                selectableIdsSet={selectableIdsSet}
                isTrashing={isTrashing}
                openOnDoubleClick={openOnDoubleClick}
              />
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

type SelectionLabelProps = { selection: RowSelection; isTrashing: boolean; label: string }

function SelectionLabel({ selection, isTrashing, label }: SelectionLabelProps) {
  return (
    <span className="flex items-center gap-3">
      <SelectAllCheckbox selection={selection} isTrashing={isTrashing} />
      {selection.selectedIds.length > 0 ? (
        <span aria-live="polite" data-testid="bulk-selected-count">
          {c('Info').ngettext(
            msgid`${selection.selectedIds.length} selected`,
            `${selection.selectedIds.length} selected`,
            selection.selectedIds.length,
          )}
        </span>
      ) : (
        label
      )}
    </span>
  )
}

type SelectAllCheckboxProps = { selection: RowSelection; isTrashing: boolean }

function SelectAllCheckbox({ selection, isTrashing }: SelectAllCheckboxProps) {
  return (
    <Checkbox
      checked={selection.allState === 'all'}
      indeterminate={selection.allState === 'some'}
      onChange={selection.toggleAll}
      disabled={isTrashing}
      aria-label={c('Label').t`Select all`}
      data-testid="bulk-select-all"
    />
  )
}

type BulkTrashButtonProps = {
  selection: RowSelection
  documents: RecentDocumentsItem[]
  trash: (documents: RecentDocumentsItem[]) => Promise<RecentDocumentsItem[]>
  isTrashing: boolean
}

function BulkTrashButton({ selection, documents, trash, isTrashing }: BulkTrashButtonProps) {
  return (
    <Tooltip title={c('Action').t`Move to trash`}>
      <Button
        icon
        shape="ghost"
        className="ml-auto shrink-0 px-2"
        loading={isTrashing}
        disabled={isTrashing}
        aria-label={c('Action').t`Move to trash`}
        onClick={async () => {
          const failed = await trash(documents)
          if (failed.length) {
            selection.set(failed.map((item) => item.uniqueId()))
          } else {
            selection.clear()
          }
        }}
        data-testid="bulk-trash-button"
      >
        <IcTrash className="shrink-0" />
      </Button>
    </Tooltip>
  )
}

function recentsLabelByType(type: ProtonDocumentType | undefined): string {
  switch (type) {
    case undefined:
      return c('Info').t`Recents`
    case 'document':
      return c('Info').t`Recent documents`
    case 'spreadsheet':
      return c('Info').t`Recent spreadsheets`
  }
}

// head
// ----

type HeadProps = {
  variant: TableVariant
  sectionId: ItemsSectionId
  hasCheckbox: boolean
  selectionControls?: ReactNode
}

function Head({ variant, sectionId, hasCheckbox, selectionControls }: HeadProps) {
  const firstHeaderSorted = variant === 'recents-name' || variant === 'trash'
  const secondHeaderSorted = variant === 'recents-viewed' || variant === 'recents-modified'
  const thirdHeaderSorted = variant === 'recents-owner'
  const fourthHeaderSorted = variant === 'recents-location'

  return (
    <Table.Head secondarySticky topLevelSticky topLevelStickyOnlyOnMobile className="border-weak border-b">
      <Table.Header>
        {selectionControls ?? (
          <div className="flex items-center gap-3">
            {/* Same width as the row checkboxes, so that the label aligns with the names. */}
            {hasCheckbox && <span className="w-5 shrink-0" />}
            <MaybeSorted sorted={firstHeaderSorted}>{getSectionLabel(sectionId)}</MaybeSorted>
          </div>
        )}
      </Table.Header>
      <Table.Header target="large">
        <MaybeSorted sorted={secondHeaderSorted}>
          <span>{getDateHeaderLabel(variant)}</span>
        </MaybeSorted>
      </Table.Header>
      <Table.Header target="medium">
        <MaybeSorted sorted={thirdHeaderSorted}>{c('Recent documents table header').t`Created by`}</MaybeSorted>
      </Table.Header>
      <Table.Header target="medium">
        <div className="flex flex-nowrap items-center justify-between">
          <MaybeSorted sorted={fourthHeaderSorted}>
            <span>{c('Recent documents table header').t`Location`}</span>
          </MaybeSorted>
        </div>
      </Table.Header>
    </Table.Head>
  )
}

type SectionLabelProps = { sectionId: ItemsSectionId; hasCheckbox: boolean }

function SectionLabel({ sectionId, hasCheckbox }: SectionLabelProps) {
  return (
    <Table.Row className="border-weak !h-[2.75rem] border-y">
      <Table.Header>
        <span className="flex items-center gap-3">
          {/* Same width as the row checkboxes, so that the label aligns with the names. */}
          {hasCheckbox && <span className="w-5 shrink-0" />}
          {getSectionLabel(sectionId)}
        </span>
      </Table.Header>
    </Table.Row>
  )
}

const SORT_SELECT_OPTIONS = [
  { value: 'viewed', label: () => c('Sort menu options').t`Last viewed first` },
  // TODO: re-enable once "last modified" is supported.
  // { value: 'modified', label: () => c('Actions').t`Last modified first` },
  { value: 'name', label: () => c('Sort menu options').t`Name` },
  { value: 'owner', label: () => c('Sort menu options').t`Created by` },
  { value: 'location', label: () => c('Sort menu options').t`Location` },
] satisfies { value: RecentsSort; label: () => string }[]

const TELEMETRY_EVENT_BY_SORT: Record<RecentsSort, TelemetryDocsHomepageEvents> = {
  viewed: TelemetryDocsHomepageEvents.sorting_changed_to_time,
  //   modified: TelemetryDocsHomepageEvents.sorting_changed_to_modified,
  name: TelemetryDocsHomepageEvents.sorting_changed_to_name,
  owner: TelemetryDocsHomepageEvents.sorting_changed_to_owner,
  location: TelemetryDocsHomepageEvents.sorting_changed_to_location,
}

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
          <IcArrowDownArrowUp className="shrink-0" />
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
                application.metrics.reportHomepageTelemetry(TELEMETRY_EVENT_BY_SORT[value])
              }}
              className="flex items-center gap-2"
            >
              <span>{label()}</span>
              {sortValue === value ? <IcCheckmark /> : null}
            </DropdownMenuButton>
          ))}
        </DropdownMenu>
      </Dropdown>
    </>
  )
}

interface MaybeSortedProps extends ComponentPropsWithoutRef<'span'> {
  sorted?: boolean
}

function MaybeSorted({ sorted, ...props }: MaybeSortedProps) {
  return (
    <span {...props} className={clsx('flex flex-nowrap items-center gap-[.375rem]', props.className)}>
      <span>{props.children}</span>
      {sorted ? <IcArrowDown size={4} className="text-[--icon-norm]" /> : null}
    </span>
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

function getDateHeaderLabel(variant: TableVariant): string {
  switch (variant) {
    case 'recents-modified':
      return c('Recent documents table header').t`Modified`
    case 'trash':
      return c('Recent documents table header').t`Deleted`
    default:
      return c('Recent documents table header').t`Viewed`
  }
}

// body
// ----

type BodyProps = {
  items: RecentDocumentsItem[]
  variant: TableVariant
  addresses: Address[] | undefined
  selection?: RowSelection
  selectableIdsSet: Set<string>
  isTrashing: boolean
  openOnDoubleClick: boolean
}

function Body({ items, variant, addresses, selection, selectableIdsSet, isTrashing, openOnDoubleClick }: BodyProps) {
  return (
    <Table.Body className="divide-weak divide-y">
      {items.map((recentDocument) => (
        <Row
          variant={variant}
          key={recentDocument.uniqueId()}
          document={recentDocument}
          addresses={addresses}
          selection={selection}
          isSelectable={selectableIdsSet.has(recentDocument.uniqueId())}
          isTrashing={isTrashing}
          openOnDoubleClick={openOnDoubleClick}
        />
      ))}
    </Table.Body>
  )
}

// row
// ---

// Refresh dates every minute.
const REFRESH_DATE_INTERVAL = 1000 * 60 // ms

// Lifts controls above the row activator, so that they keep their own clicks.
const RAISED = 'relative z-[1]'

type RowProps = {
  document: RecentDocumentsItem
  variant: TableVariant
  addresses: Address[] | undefined
  selection?: RowSelection
  isSelectable?: boolean
  isTrashing?: boolean
  openOnDoubleClick?: boolean
}

function Row({ document, variant, addresses, selection, isSelectable, isTrashing, openOnDoubleClick }: RowProps) {
  const { getLocalID } = useAuthentication()
  const documentActions = useDocumentActions()
  const { location } = document
  const { displayName, avatarContent } = useNameAndAvatar(document, addresses)
  const { updateRenamedDocumentInCache } = useHomepageView()
  const { createNotification } = useNotifications()

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

  let LocationIcon: IconComponent
  let locationLabel: string
  if (variant === 'trash') {
    LocationIcon = IcTrash
    locationLabel = c('Label').t`Trash`
  } else if (location?.type === 'shared-with-me') {
    LocationIcon = IcUsers
    locationLabel = c('Label').t`Shared with me`
  } else if (location?.type === 'root') {
    LocationIcon = IcInbox
    locationLabel = c('Label').t`My files`
  } else {
    LocationIcon = IcFolder
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
      className={clsx('text-pre flex flex-nowrap items-center px-2', RAISED)}
      title={!isLocationPath ? locationLabel : undefined}
      data-testid="document-location-button"
    >
      <LocationIcon className="mr-2 shrink-0" />
      <span className="overflow-hidden text-ellipsis">{locationLabel}</span>
    </Button>
  )
  if (isLocationPath) {
    locationContent = <Tooltip title={location?.path?.join(' / ')}>{locationContent}</Tooltip>
  }

  const contextMenu = useContextMenu()

  const isRenaming = documentActions.isRenaming(document)
  const DocumentTypeIcon = ICON_BY_TYPE[document.type]

  const isSelected = !!selection?.isSelected(document.uniqueId())
  const selectable = isSelectable && !isTrashing ? selection : undefined

  const open = () => documentActions.open(document, variant === 'trash' ? 'trash' : 'normal')
  const doubleClick = useDoubleClick(open)

  return (
    <Table.Row
      className={clsx(
        // `z-0` keeps the raised controls below the sticky head.
        'group-hover-opacity-container relative z-0 hover:bg-[--optional-background-lowered]',
        openOnDoubleClick ? 'select-none' : 'cursor-pointer',
        isSelected && 'bg-[--optional-background-lowered]',
      )}
      data-selected={isSelected ? '' : undefined}
      onClick={
        openOnDoubleClick
          ? undefined
          : (event) => {
              event.stopPropagation()
              open()
            }
      }
      onContextMenu={(event) => {
        event.stopPropagation()
        if (!isSelected) {
          selectable?.select(document.uniqueId())
        }
        contextMenu.setCurrentDocument(document)
        contextMenu.handleContextMenu(event)
      }}
    >
      <Table.DataCell>
        <span title={openOnDoubleClick ? undefined : document.name} className="flex flex-nowrap items-center gap-3">
          {selection && (
            // Empty for non-trashable rows, so that names stay aligned.
            <span
              className={clsx(
                'flex w-5 shrink-0',
                isSelectable && RAISED,
                selection.selectedIds.length === 0 && 'mouse:group-hover:opacity-100',
              )}
            >
              {isSelectable && (
                <Checkbox
                  // Like Drive, the whole cell is clickable.
                  className="expand-click-area"
                  checked={isSelected}
                  readOnly
                  onClick={(event) => {
                    if (!event.shiftKey) {
                      selection.toggle(document.uniqueId())
                    }
                  }}
                  // Shift is handled on the label, because Firefox doesn't forward shift-clicks from
                  // labels to inputs: https://bugzilla.mozilla.org/show_bug.cgi?id=559506
                  labelOnClick={(event) => {
                    if (event.shiftKey) {
                      selectable?.toggleRange(document.uniqueId())
                    }
                  }}
                  disabled={isTrashing}
                  aria-label={c('Label').t`Select ${document.name}`}
                  data-testid="bulk-row-checkbox"
                />
              )}
            </span>
          )}
          <DocumentTypeIcon
            size={5}
            className="shrink-0 text-[--icon-color]"
            style={{ '--icon-color': COLOR_BY_TYPE[document.type] }}
          />
          {isRenaming ? (
            <Input
              ref={(element) => {
                element?.select()
              }}
              className={RAISED}
              defaultValue={document.name}
              onClick={(event) => event.stopPropagation()}
              disabled={documentActions.isRenameSaving}
              onKeyDown={async (event) => {
                // Accept name change
                if (event.key === 'Enter') {
                  const { value } = event.currentTarget
                  try {
                    await documentActions.rename(document, value)
                    await updateRenamedDocumentInCache(document.uniqueId(), value)
                  } catch (error) {
                    createNotification({
                      type: 'error',
                      text: c('Notification').t`Failed to rename document`,
                    })
                    traceError(error, {
                      tags: {
                        initiative: SentryRealtimeInitiatives.SDK_SWITCH,
                        feature: 'DocsRenameWithDriveSDK',
                      },
                    })
                  }
                }

                // Revoke name change
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
        </span>
      </Table.DataCell>

      <Table.DataCell target="large">
        <span title={getRelativeDate(document)} className="truncate">
          {getRelativeDate(document)}
        </span>
      </Table.DataCell>

      <Table.DataCell target="medium">
        <span className="flex flex-nowrap items-center gap-2 overflow-hidden" title={displayName}>
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
          <Tooltip title={c('Action').t`Actions`}>
            <Button
              onClick={(event) => {
                event.stopPropagation()
                contextMenu.setCurrentDocument(document)
                contextMenu.handleContextMenu(event)
              }}
              shape="ghost"
              className={clsx('ml-auto shrink-0 px-2', RAISED)}
              aria-label={c('Action').t`Actions`}
            >
              <IcThreeDotsVertical />
            </Button>
          </Tooltip>
        </div>
      </Table.DataCell>

      {/* Like Drive's `ItemA11yActivator`: a row-sized button under the controls, focusable and announced for the whole row. */}
      {/* `z-0` because Proton's `absolute` also sets `z-index: 1`, which would cover the raised controls. */}
      {openOnDoubleClick && (
        <Table.DataCell className="absolute inset-0 z-0">
          <button
            type="button"
            className={clsx(
              // `touch-manipulation` stops double tap from zooming, and drops the tap delay.
              'bg-transparent h-full w-full cursor-default touch-manipulation border-0 p-0',
              'focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[--focus-outline]',
            )}
            aria-label={getRowAriaLabel({
              document,
              isSelected: isSelectable ? isSelected : undefined,
              dateLabel: `${getDateHeaderLabel(variant)} ${getRelativeDate(document)}`,
              displayName,
              locationLabel,
            })}
            aria-pressed={isSelectable ? isSelected : undefined}
            // The button covers the cells, so it carries the name tooltip for them.
            title={document.name}
            data-item-activator
            data-testid="row-activator"
            onClick={(event) => {
              if (selectable) {
                selectOnClick(selectable, document.uniqueId(), event)
              }
            }}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault()
                open()
              } else if (event.key === ' ' && selectable) {
                event.preventDefault()
                selectable.toggle(document.uniqueId())
              }
            }}
            {...doubleClick}
          />
        </Table.DataCell>
      )}
    </Table.Row>
  )
}

// utils
// -----

// Like Drive's `useArrowKeyNavigation`: arrows move focus between rows, Space selects.
function moveRowFocus(event: KeyboardEvent<HTMLElement>) {
  const { key, target, currentTarget } = event
  // `contains` skips keys bubbling from portals (e.g. the sort dropdown).
  if (!(target instanceof Element) || !currentTarget.contains(target)) {
    return
  }
  const activators = [...currentTarget.querySelectorAll<HTMLElement>('[data-item-activator]')]
  const row = target.closest('[role="row"]')
  const index = getNextRowIndex(
    key,
    activators.findIndex((activator) => row?.contains(activator)),
    activators.length - 1,
  )
  const activator = index === undefined ? undefined : activators[index]
  if (activator) {
    event.preventDefault()
    activator.focus()
  }
}

function getNextRowIndex(key: string, current: number, last: number): number | undefined {
  switch (key) {
    case 'ArrowDown':
      return current < 0 ? 0 : Math.min(current + 1, last)
    case 'ArrowUp':
      return current < 0 ? last : Math.max(current - 1, 0)
    case 'Home':
      return 0
    case 'End':
      return last
  }
}

type RowAriaLabelParams = {
  document: RecentDocumentsItem
  isSelected: boolean | undefined
  dateLabel: string
  displayName: string | undefined
  locationLabel: string
}

// Like Drive's `getFolderItemAriaLabel`: mirrors the visible columns, prefixed with the selection state.
function getRowAriaLabel({ document, isSelected, dateLabel, displayName, locationLabel }: RowAriaLabelParams) {
  const parts = [
    document.name,
    document.type === 'spreadsheet' ? c('Label').t`Spreadsheet` : c('Label').t`Document`,
    dateLabel,
    displayName && c('Label').t`Created by ${displayName}`,
    c('Label').t`Location ${locationLabel}`,
  ].filter(Boolean)
  if (isSelected !== undefined) {
    parts.unshift(isSelected ? c('Label').t`Selected` : c('Label').t`Not selected`)
  }
  return parts.join(', ')
}

// Same modifiers as Drive's `useItemInteraction`.
function selectOnClick(selection: RowSelection, id: string, { shiftKey, ctrlKey, metaKey }: MouseEvent) {
  if (shiftKey) {
    selection.toggleRange(id)
  } else if (ctrlKey || metaKey) {
    selection.toggle(id)
  } else {
    selection.select(id)
  }
}

function useNameAndAvatar(document: RecentDocumentsItem, addresses: Address[] | undefined) {
  const [contactEmails] = useContactEmails()

  const isMine = isMyDocument(document, addresses)
  const displayName = getOwnerName(document, isMine, contactEmails)

  let avatarContent: ReactNode = <IcUserFilled className="shrink-0" />
  if (!isMine) {
    if (!document.createdBy) {
      avatarContent = <IcUser className="shrink-0" />
    } else {
      avatarContent = getInitials(document.createdBy)
    }
  }

  return { displayName, avatarContent }
}

const dateFormatter = new DateFormatter()

function getRelativeDate({ lastViewed }: RecentDocumentsItem): string {
  const text = dateFormatter.formatDateOrTimeIfToday(lastViewed.date, c('Info').t`Just now`)
  return text.charAt(0).toUpperCase() + text.slice(1)
}
