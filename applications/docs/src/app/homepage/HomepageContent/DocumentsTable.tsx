import * as Ariakit from '@ariakit/react'
import { Avatar, Input } from '../components/atoms'
import { Button, Checkbox, IconButton, Tooltip, TooltipProvider } from '../components/ui'
import { useIsNarrow } from '../utils/useIsNarrow'
import type { RecentDocumentsItem } from '../recentDocumentsItem'
import type { DateFormatter } from '../utils/dateFormatter'
import { SDK_SWITCH_INITIATIVE } from '../utils/errorTracking'
import { APPS } from '../utils/apps'
import type { ProtonDocumentType } from '../utils/mimetype'
import { getInitials } from './getInitials'
import { clsx } from '../utils/clsx'
import type { ComponentPropsWithoutRef, KeyboardEvent, MouseEvent, ReactNode } from 'react'
import { Fragment, useEffect, useRef, useState } from 'react'
import { useHomepageMessages } from '../messages/HomepageMessagesProvider'
import type { HomepageMessages } from '../messages/defaultHomepageMessages'
import { useEvent } from '../utils/useEvent'
import { useDocumentActions } from '../documentActionsContext'
import { useHomepageView, type ItemsSection, type ItemsSectionId } from '../homepageViewContext'
import { isMyDocument } from '../is-my-document'
import { useRowSelection, type RowSelection } from './useRowSelection'
import { SortSelect } from './SortSelect'
import { DocContextMenu, canOrganize } from './DocContextMenu/DocContextMenu'
import { useContextMenu } from './DocContextMenu/context'
import { COLOR_BY_TYPE, ContentSheet, ICON_BY_TYPE } from './shared'
import { Icon, type IconData } from '../components/Icon'
import * as Icons from '../components/icons'
import * as Table from './table'

import { getOwnerName } from '../get-owner-name'
import { useDoubleClick } from '../utils/useDoubleClick'

// table
// -----

export type TableVariant =
  | 'recents-name'
  | 'recents-viewed'
  | 'recents-modified'
  | 'recents-owner'
  | 'recents-location'
  | 'trash'
  | 'search'
export type DocumentsTableProps = { itemsSections: ItemsSection[]; variant: TableVariant }

export function DocumentsTable({ itemsSections, variant }: DocumentsTableProps) {
  const messages = useHomepageMessages().documentsTable
  const { type, state, myFilesRootUid, featureFlags } = useHomepageView()
  const contextMenu = useContextMenu()
  const isRecents = variant.startsWith('recents')
  const isSearch = variant === 'search'

  // Like Drive: single click selects, double click opens.
  const openOnDoubleClick = featureFlags.bulkTrash
  const bulkEnabled = openOnDoubleClick && (isRecents || isSearch)
  const allItems = itemsSections.flatMap(({ items }) => items)
  const selectableIds = bulkEnabled ? allItems.filter(canOrganize).map((item) => item.uniqueId()) : []
  const selectableIdsSet = new Set(selectableIds)
  const resetKey = `${state.view}|${'query' in state ? state.query : ''}|${type}`
  const selection = useRowSelection(selectableIds, resetKey)
  const { bulkTrash, isBulkTrashing: isTrashing, bulkMove } = useDocumentActions()
  const hasSelection = selection.selectedIds.length > 0
  const selectedDocuments = allItems.filter((item) => selection.isSelected(item.uniqueId()))
  // The move modal fails on nodes from more than one root, and the user's own documents can also sit on a device.
  const canBulkMove =
    featureFlags.bulkMove && selectedDocuments.every((document) => isInMyFiles(document, myFilesRootUid))
  // Like Drive, where moved documents leave the folder.
  const deselect = useEvent((documents: RecentDocumentsItem[]) => {
    const ids = documents.map((document) => document.uniqueId())
    selection.set(selection.selectedIds.filter((id) => !ids.includes(id)))
  })
  const moveSelection = () => bulkMove(selectedDocuments, deselect)
  const trashSelection = async () => {
    const failed = await bulkTrash(selectedDocuments)
    if (failed.length) {
      selection.set(failed.map((item) => item.uniqueId()))
    } else {
      selection.clear()
    }
  }
  const { currentDocument } = contextMenu
  const isSelectionMenu =
    featureFlags.bulkMove &&
    selection.selectedIds.length > 1 &&
    currentDocument !== undefined &&
    selection.isSelected(currentDocument.uniqueId())
  // The title is hidden on mobile, so the selection controls move to the head, like in Drive.
  const isNarrow = useIsNarrow()
  const hasSelectionControls = selectableIds.length > 0

  const label = isRecents || isSearch ? recentsLabelByType(type, messages) : messages.trash
  const bulkActions = (
    <span className="ml-auto flex shrink-0 items-center">
      {canBulkMove && <BulkMoveButton onMove={moveSelection} disabled={isTrashing} />}
      <BulkTrashButton onTrash={trashSelection} isTrashing={isTrashing} />
    </span>
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
            {hasSelection && !isNarrow ? bulkActions : isRecents && <SortSelect />}
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
                    label={getSectionLabel(itemsSections[0].id, messages)}
                  />
                  {hasSelection && bulkActions}
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
        currentDocument={currentDocument}
        selectionActions={
          isSelectionMenu
            ? { move: canBulkMove ? moveSelection : undefined, trash: trashSelection, disabled: isTrashing }
            : undefined
        }
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
  const messages = useHomepageMessages().documentsTable
  return (
    <span className="flex items-center gap-3">
      <SelectAllCheckbox selection={selection} isTrashing={isTrashing} />
      {selection.selectedIds.length > 0 ? (
        <span aria-live="polite" data-testid="bulk-selected-count">
          {messages.selected(selection)}
        </span>
      ) : (
        label
      )}
    </span>
  )
}

type SelectAllCheckboxProps = { selection: RowSelection; isTrashing: boolean }

function SelectAllCheckbox({ selection, isTrashing }: SelectAllCheckboxProps) {
  const messages = useHomepageMessages().documentsTable
  return (
    <Checkbox
      checked={selection.allState === 'some' ? 'mixed' : selection.allState === 'all'}
      onChange={selection.toggleAll}
      disabled={isTrashing}
      aria-label={messages.selectAll}
      data-testid="bulk-select-all"
    />
  )
}

// Ancestors run from the parent to the root.
function isInMyFiles(document: RecentDocumentsItem, myFilesRootUid: string | undefined) {
  return myFilesRootUid !== undefined && document.ancestorsNodeUids?.at(-1) === myFilesRootUid
}

type BulkMoveButtonProps = { onMove: () => void; disabled: boolean }

function BulkMoveButton({ onMove, disabled }: BulkMoveButtonProps) {
  const messages = useHomepageMessages().documentsTable
  return (
    <IconButton
      label={messages.move}
      shape="ghost"
      className="shrink-0 px-2"
      disabled={disabled}
      onClick={onMove}
      data-testid="bulk-move-button"
    >
      <Icon data={Icons.arrowsCross} className="shrink-0" />
    </IconButton>
  )
}

type BulkTrashButtonProps = { onTrash: () => Promise<void>; isTrashing: boolean }

function BulkTrashButton({ onTrash, isTrashing }: BulkTrashButtonProps) {
  const messages = useHomepageMessages().documentsTable
  return (
    <IconButton
      label={messages.moveToTrash}
      shape="ghost"
      className="shrink-0 px-2"
      loading={isTrashing}
      onClick={onTrash}
      data-testid="bulk-trash-button"
    >
      <Icon data={Icons.trash} className="shrink-0" />
    </IconButton>
  )
}

function recentsLabelByType(type: ProtonDocumentType | undefined, messages: DocumentsTableMessages): string {
  switch (type) {
    case undefined:
      return messages.recents
    case 'document':
      return messages.recentDocuments
    case 'spreadsheet':
      return messages.recentSpreadsheets
  }
}
type DocumentsTableMessages = HomepageMessages['documentsTable']

// head
// ----

type HeadProps = {
  variant: TableVariant
  sectionId: ItemsSectionId
  hasCheckbox: boolean
  selectionControls?: ReactNode
}

function Head({ variant, sectionId, hasCheckbox, selectionControls }: HeadProps) {
  const messages = useHomepageMessages().documentsTable
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
            <MaybeSorted sorted={firstHeaderSorted}>{getSectionLabel(sectionId, messages)}</MaybeSorted>
          </div>
        )}
      </Table.Header>
      <Table.Header target="large">
        <MaybeSorted sorted={secondHeaderSorted}>
          <span>{getDateHeaderLabel(variant, messages)}</span>
        </MaybeSorted>
      </Table.Header>
      <Table.Header target="medium">
        <MaybeSorted sorted={thirdHeaderSorted}>{messages.header.createdBy}</MaybeSorted>
      </Table.Header>
      <Table.Header target="medium">
        <div className="flex flex-nowrap items-center justify-between">
          <MaybeSorted sorted={fourthHeaderSorted}>
            <span>{messages.header.location}</span>
          </MaybeSorted>
        </div>
      </Table.Header>
    </Table.Head>
  )
}

type SectionLabelProps = { sectionId: ItemsSectionId; hasCheckbox: boolean }

function SectionLabel({ sectionId, hasCheckbox }: SectionLabelProps) {
  const messages = useHomepageMessages().documentsTable
  return (
    <Table.Row className="border-weak !h-[2.75rem] border-y">
      <Table.Header>
        <span className="flex items-center gap-3">
          {/* Same width as the row checkboxes, so that the label aligns with the names. */}
          {hasCheckbox && <span className="w-5 shrink-0" />}
          {getSectionLabel(sectionId, messages)}
        </span>
      </Table.Header>
    </Table.Row>
  )
}

interface MaybeSortedProps extends ComponentPropsWithoutRef<'span'> {
  sorted?: boolean
}

function MaybeSorted({ sorted, ...props }: MaybeSortedProps) {
  return (
    <span {...props} className={clsx('flex flex-nowrap items-center gap-[.375rem]', props.className)}>
      <span>{props.children}</span>
      {sorted ? <Icon data={Icons.arrowDown} className="text-[--icon-norm]" /> : null}
    </span>
  )
}

function getSectionLabel(id: ItemsSectionId, messages: DocumentsTableMessages): string {
  switch (id) {
    case 'search-results':
      return messages.header.searchResults
    case 'name':
      return messages.header.name
    case 'today':
      return messages.header.today
    case 'yesterday':
      return messages.header.yesterday
    case 'previous7Days':
      return messages.header.previous7Days
    case 'previous30Days':
      return messages.header.previous30Days
    case 'earlier':
      return messages.header.earlier
  }
}

function getDateHeaderLabel(variant: TableVariant, messages: DocumentsTableMessages): string {
  switch (variant) {
    case 'recents-modified':
      return messages.header.modified
    case 'trash':
      return messages.header.deleted
    default:
      return messages.header.viewed
  }
}

// body
// ----

type BodyProps = {
  items: RecentDocumentsItem[]
  variant: TableVariant
  selection?: RowSelection
  selectableIdsSet: Set<string>
  isTrashing: boolean
  openOnDoubleClick: boolean
}

function Body({ items, variant, selection, selectableIdsSet, isTrashing, openOnDoubleClick }: BodyProps) {
  return (
    <Table.Body className="divide-weak divide-y">
      {items.map((recentDocument) => (
        <Row
          variant={variant}
          key={recentDocument.uniqueId()}
          document={recentDocument}
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
  selection?: RowSelection
  isSelectable?: boolean
  isTrashing?: boolean
  openOnDoubleClick?: boolean
}

function Row({ document, variant, selection, isSelectable, isTrashing, openOnDoubleClick }: RowProps) {
  const messages = useHomepageMessages().documentsTable
  const documentActions = useDocumentActions()
  const { location } = document
  const { displayName, avatarContent } = useNameAndAvatar(document)
  const { updateRenamedDocumentInCache, createNotification, getAppHref, dateFormatter, errorTracking, featureFlags } =
    useHomepageView()

  // Force re-render every REFRESH_DATE_INTERVAL milliseconds
  const [, setState] = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval>>(undefined)
  useEffect(() => {
    intervalRef.current = setInterval(() => setState((prev) => !prev), REFRESH_DATE_INTERVAL)
    return () => clearInterval(intervalRef.current)
  }, [])

  if (!location) {
    throw new Error('Unexpected missing location')
  }

  let locationIcon: IconData
  let locationLabel: string
  if (variant === 'trash') {
    locationIcon = Icons.trash
    locationLabel = messages.location.trash
  } else if (location?.type === 'shared-with-me') {
    locationIcon = Icons.users
    locationLabel = messages.location.sharedWithMe
  } else if (location?.type === 'root') {
    locationIcon = Icons.inbox
    locationLabel = messages.location.myFiles
  } else {
    locationIcon = Icons.folder
    locationLabel = location?.path.at(-1)!
  }
  const isLocationPath = location?.type === 'path'
  let locationContent = (
    <Button
      onClick={(event) => {
        event.stopPropagation()
        if (variant === 'trash') {
          window.open(getAppHref('/trash', APPS.PROTONDRIVE))
        } else {
          documentActions.openParent(document)
        }
      }}
      shape="ghost"
      className={clsx('text-pre flex flex-nowrap items-center px-2', RAISED)}
      title={!isLocationPath ? locationLabel : undefined}
      data-testid="document-location-button"
    >
      <Icon data={locationIcon} className="mr-2 shrink-0" />
      <span className="overflow-hidden text-ellipsis">{locationLabel}</span>
    </Button>
  )
  if (isLocationPath) {
    locationContent = (
      <TooltipProvider>
        <Ariakit.TooltipAnchor render={locationContent} />
        <Tooltip>{location?.path?.join(' / ')}</Tooltip>
      </TooltipProvider>
    )
  }

  const contextMenu = useContextMenu()
  const isMenuOpen = contextMenu.isOpen && contextMenu.currentDocument?.uniqueId() === document.uniqueId()
  const showActionsOnHover = featureFlags.bulkMove && !isMenuOpen

  const isRenaming = documentActions.isRenaming(document)

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
                  expandClickArea
                  checked={isSelected}
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
                  aria-label={messages.selectDocument(document)}
                  data-testid="bulk-row-checkbox"
                />
              )}
            </span>
          )}
          <Icon
            data={ICON_BY_TYPE[document.type]}
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
                      text: messages.renameFailed,
                    })
                    errorTracking.traceError(error, {
                      tags: {
                        initiative: SDK_SWITCH_INITIATIVE,
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
        <span title={getRelativeDate(dateFormatter, document, messages)} className="truncate">
          {getRelativeDate(dateFormatter, document, messages)}
        </span>
      </Table.DataCell>

      <Table.DataCell target="medium">
        <span className="flex flex-nowrap items-center gap-2 overflow-hidden" title={displayName}>
          <Avatar>{avatarContent}</Avatar>
          <span className="text-pre flex-1 text-ellipsis">{displayName}</span>
        </span>
      </Table.DataCell>

      <Table.DataCell target="medium">
        <div className="-ms-2 flex w-full flex-nowrap justify-between">
          {locationContent}
          <IconButton
            label={messages.actions}
            // A text button's padding, as before, so the row keeps its height.
            icon={false}
            onClick={(event) => {
              event.stopPropagation()
              if (featureFlags.bulkMove && !isTrashing) {
                if (isSelectable) {
                  selection?.select(document.uniqueId())
                } else {
                  selection?.clear()
                }
              }
              contextMenu.setCurrentDocument(document)
              contextMenu.handleContextMenu(event)
            }}
            shape="ghost"
            className={clsx('ml-auto shrink-0 px-2', RAISED, showActionsOnHover && 'mouse:group-hover:opacity-100')}
          >
            <Icon data={Icons.threeDotsVertical} />
          </IconButton>
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
            aria-label={getRowAriaLabel(
              {
                document,
                isSelected: isSelectable ? isSelected : undefined,
                dateLabel: `${getDateHeaderLabel(variant, messages)} ${getRelativeDate(dateFormatter, document, messages)}`,
                displayName,
                locationLabel,
              },
              messages,
            )}
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
  // `contains` skips keys bubbling from portals (e.g. the sort menu), `defaultPrevented` keys a control
  // inside the table already handled (e.g. the arrows that open the sort menu).
  if (event.defaultPrevented || !(target instanceof Element) || !currentTarget.contains(target)) {
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
function getRowAriaLabel(
  { document, isSelected, dateLabel, displayName, locationLabel }: RowAriaLabelParams,
  messages: DocumentsTableMessages,
) {
  const parts = [
    document.name,
    document.type === 'spreadsheet' ? messages.rowLabel.spreadsheet : messages.rowLabel.document,
    dateLabel,
    displayName && messages.rowLabel.createdBy(displayName),
    messages.rowLabel.location(locationLabel),
  ].filter(Boolean)
  if (isSelected !== undefined) {
    parts.unshift(isSelected ? messages.rowLabel.selected : messages.rowLabel.notSelected)
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

function useNameAndAvatar(document: RecentDocumentsItem) {
  const { addresses, contactEmails } = useHomepageView()
  const { names } = useHomepageMessages()

  const isMine = isMyDocument(document, addresses)
  const displayName = getOwnerName(document, isMine, contactEmails, names)

  let avatarContent: ReactNode = <Icon data={Icons.userFilled} className="shrink-0" />
  if (!isMine) {
    if (!document.createdBy) {
      avatarContent = <Icon data={Icons.user} className="shrink-0" />
    } else {
      avatarContent = getInitials(document.createdBy)
    }
  }

  return { displayName, avatarContent }
}

function getRelativeDate(
  dateFormatter: DateFormatter,
  { lastViewed }: RecentDocumentsItem,
  messages: DocumentsTableMessages,
): string {
  const text = dateFormatter.formatDateOrTimeIfToday(lastViewed.date, messages.justNow)
  return text.charAt(0).toUpperCase() + text.slice(1)
}
