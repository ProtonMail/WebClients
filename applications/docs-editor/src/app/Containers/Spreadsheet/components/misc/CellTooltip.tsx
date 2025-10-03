import type { CellTooltipProps } from '@rowsncolumns/spreadsheet'
import { CellTooltip as DefaultCellTooltip } from '@rowsncolumns/spreadsheet'
import * as Ariakit from '@ariakit/react'
import { Icon } from '../ui'
import * as UI from '../ui'
import { createStringifier } from '../../stringifier'
import { c } from 'ttag'
import { useApplication } from '../../../ApplicationProvider'
import { OPEN_LINK_EVENT } from '../../constants'
import { type Ref, useCallback } from 'react'
import { copyTextToClipboard } from '../../../../Utils/copy-to-clipboard'
import { useUI } from '../../ui-store'
import { type IconName, useNotifications } from '@proton/components'
import type { CellInterface } from '@rowsncolumns/grid'
import { createComponent } from '../utils'
import clsx from '@proton/utils/clsx'

const { s } = createStringifier(strings)

export function CellTooltip({
  x = 0,
  y = 0,
  width = 0,
  height = 0,
  scrollLeft = 0,
  scrollTop = 0,
  position = 'bottom',
  variant,
  content,
  title,
  note,
  noteEditorCell,
  hyperlink,
  cell,
  onRequestPersistence,
  onRequestUpdateNote,
  onRequestCloseNote,
}: CellTooltipProps) {
  const sheetId = useUI((state) => state.legacy.activeSheetId)
  const onRemoveLink = useUI.$.legacy.onRemoveLink
  if (!hyperlink) {
    if (!title && !content && !note) {
      // no tooltip to show
      return null
    }

    // default tooltip for notes and errors
    return (
      <DefaultCellTooltip
        x={x}
        y={y}
        width={width}
        height={height}
        scrollLeft={scrollLeft}
        scrollTop={scrollTop}
        position={position}
        variant={variant}
        content={content}
        title={title}
        note={note}
        noteEditorCell={noteEditorCell}
        hyperlink={hyperlink}
        cell={cell}
        onRequestPersistence={onRequestPersistence}
        onRequestUpdateNote={onRequestUpdateNote}
        onRequestCloseNote={onRequestCloseNote}
        sheetId={sheetId}
        onRemoveLink={onRemoveLink}
      />
    )
  }

  return (
    <LinkInfoTooltip
      hyperlink={hyperlink}
      position={position}
      x={x}
      y={y}
      width={width}
      height={height}
      scrollLeft={scrollLeft}
      scrollTop={scrollTop}
      onRequestCloseNote={onRequestCloseNote}
      cell={cell}
      sheetId={sheetId}
      onRemoveLink={onRemoveLink}
    />
  )
}

export interface ItemProps extends Ariakit.ButtonProps {
  ref?: Ref<HTMLButtonElement>
  legacyIconName?: IconName
  children?: string
}
const Button = createComponent<ItemProps>(function Item({ legacyIconName, children, ...props }: ItemProps) {
  const outputProps = {
    ...props,
    className: clsx(
      'flex shrink-0 items-center justify-center gap-[.375rem] rounded-[.5rem] text-[#0C0C14] focus:outline-none aria-disabled:text-[#8F8D8A]',
      'aria-expanded:bg-[#C2C1C0]/20',
      'p-[.625rem]',
      'bg-[white]',
      // TODO: "hocus" type tw variant
      'hover:bg-[#C2C1C0]/20 focus-visible:bg-[#C2C1C0]/20 data-[focus-visible]:bg-[#C2C1C0]/20',
      // TODO: "active" tw variant
      // TODO: see hack for specificity, otherwise active styles are overridden by data-[focus-visible] :(
      'active:active:bg-[#C2C0BE]/35 data-[active]:bg-[#C2C0BE]/35',
      'aria-pressed:aria-pressed:bg-[#C2C0BE]/35',
      props.className,
    ),
  }

  const content = (
    <Ariakit.ToolbarItem aria-label={children} accessibleWhenDisabled>
      {legacyIconName && <Icon className="shrink-0" legacyName={legacyIconName} />}
    </Ariakit.ToolbarItem>
  )

  return (
    <Ariakit.TooltipProvider placement="bottom">
      {/* @ts-expect-error - fix typings */}
      <Ariakit.TooltipAnchor {...outputProps} render={content} />
      <UI.Tooltip>{children}</UI.Tooltip>
    </Ariakit.TooltipProvider>
  )
})

function LinkInfoTooltip({
  hyperlink,
  position,
  x,
  y,
  width,
  height,
  scrollLeft,
  scrollTop,
  onRequestCloseNote,
  cell,
  sheetId,
  onRemoveLink,
}: {
  hyperlink: string
  position: CellTooltipProps['position']
  x: number
  y: number
  width: number
  height: number
  scrollLeft: number
  scrollTop: number
  onRequestCloseNote?: () => void
  cell: CellInterface
  sheetId: number
  onRemoveLink: NonNullable<CellTooltipProps['onRemoveLink']>
}) {
  const { application } = useApplication()
  const popover = Ariakit.usePopoverStore({ open: true })
  const isReadonly = useUI((state) => state.info.isReadonly)

  const posX = position === 'right' ? x + width - scrollLeft : x - scrollLeft
  const posY = position === 'bottom' ? y + height - scrollTop : y - scrollTop

  const url = hyperlink.startsWith('http') ? hyperlink : 'https://' + hyperlink

  const { createNotification } = useNotifications()
  const copyLink = useCallback(() => {
    copyTextToClipboard(url)
    createNotification({ text: s('Copied') })
  }, [createNotification, url])

  const selections = useUI((state) => state.legacy.selections)
  const removeLink = useCallback(() => {
    onRemoveLink(sheetId, cell, selections)
    createNotification({ text: s('Removed') })
  }, [cell, createNotification, onRemoveLink, selections, sheetId])

  const openInsertLinkDialog = useUI.$.view.insertLinkDialog.open
  const editLink = useCallback(() => {
    openInsertLinkDialog(cell)
    onRequestCloseNote?.()
  }, [cell, onRequestCloseNote, openInsertLinkDialog])

  return (
    <Ariakit.PopoverProvider store={popover}>
      <Ariakit.Popover
        className="z-10 flex items-center gap-6 rounded-[4px] border border-[#D1CFCD] bg-[white] px-3 py-1.5 shadow-[0px_8px_24px_0px_rgba(0,0,0,0.16)] outline-none"
        updatePosition={() => {
          const { popoverElement } = popover.getState()
          popoverElement?.style.setProperty('transform', `translate3d(${posX}px, ${posY}px, 0)`)
        }}
        onMouseMove={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3">
          <Icon legacyName="globe" />
          <a
            href={url}
            className="max-w-[20ch] text-ellipsis text-xs font-semibold leading-5 focus-visible:shadow-none focus-visible:outline-none"
            onClick={(e) => {
              e.preventDefault()
              application.eventBus.publish({
                type: OPEN_LINK_EVENT,
                payload: {
                  link: url,
                },
              })
            }}
          >
            {hyperlink}
          </a>
        </div>
        <div className="flex items-center gap-1">
          <Button legacyIconName="squares" onClick={copyLink} disabled={isReadonly}>
            {s('Copy link')}
          </Button>
          <Button legacyIconName="pencil" onClick={editLink} disabled={isReadonly}>
            {s('Edit link')}
          </Button>
          <Button legacyIconName="link-slash" onClick={useUI.$.withFocusGrid(removeLink)} disabled={isReadonly}>
            {s('Remove link')}
          </Button>
        </div>
      </Ariakit.Popover>
    </Ariakit.PopoverProvider>
  )
}

function strings() {
  return {
    'Copy link': c('sheets_2025:Spreadsheet link tooltip').t`Copy link`,
    Copied: c('sheets_2025:Spreadsheet link tooltip').t`Link copied to clipboard`,
    'Edit link': c('sheets_2025:Spreadsheet link tooltip').t`Edit link`,
    'Remove link': c('sheets_2025:Spreadsheet link tooltip').t`Remove link`,
    Removed: c('sheets_2025:Spreadsheet link tooltip').t`Link removed`,
  }
}
