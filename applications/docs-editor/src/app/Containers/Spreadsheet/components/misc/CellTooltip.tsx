import * as Ariakit from '@ariakit/react'
import { useNotifications } from '@proton/components'
import type { IconName } from '@proton/icons/types'
import clsx from '@proton/utils/clsx'
import type { CellInterface } from '@rowsncolumns/grid'
import type { CellTooltipProps } from '@rowsncolumns/spreadsheet'
import type { ComponentPropsWithoutRef } from 'react'
import { type Ref, useCallback, useLayoutEffect, useRef, useState } from 'react'
import { c } from 'ttag'
import { copyTextToClipboard } from '../../../../Utils/copy-to-clipboard'
import { useApplication } from '../../../ApplicationProvider'
import { OPEN_LINK_EVENT } from '../../constants'
import { createStringifier } from '../../stringifier'
import { useUI } from '../../ui-store'
import * as UI from '../ui'
import { Icon } from '../ui'
import { createComponent } from '../utils'
const { s } = createStringifier(strings)

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
      'p-1',
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

export function CellTooltip({
  x = 0,
  y = 0,
  width = 0,
  height = 0,
  scrollLeft = 0,
  scrollTop = 0,
  hyperlink,
  position = 'right',
  variant,
  content,
  customContent,
  title,
  note,
  noteEditorCell,
  cell,
  onRequestShowNote,
  onRequestUpdateNote,
  onRequestCloseNote,
  onRequestPinTooltip,
  onRequestUnpinTooltip,
}: CellTooltipProps) {
  const popover = Ariakit.usePopoverStore({ open: true })
  const sheetId = useUI((state) => state.legacy.activeSheetId)
  const onRemoveLink = useUI.$.legacy.onRemoveLink

  const isError = variant === 'error'
  const isInvalid = variant === 'invalid'
  const isHyperlink = !!hyperlink
  if (!isError && !isInvalid && !isHyperlink && !note && !noteEditorCell && !customContent) {
    return null
  }

  const posX = x - scrollLeft
  const posY = y + height - scrollTop

  let contentTitle = title
  if (variant === 'error') {
    contentTitle = s('Error')
  } else if (variant === 'invalid') {
    contentTitle = s('Invalid')
  } else if (isHyperlink) {
    contentTitle = ''
  }

  return (
    <Ariakit.PopoverProvider store={popover}>
      <Ariakit.Popover
        className="z-10 overflow-clip rounded-[0.5rem] shadow-[0_8px_24px_0px_rgba(0,0,0,0.16)]"
        onMouseMove={(e) => e.stopPropagation()}
        updatePosition={() => {
          const { popoverElement } = popover.getState()
          popoverElement?.style.setProperty('transform', `translate3d(${posX}px, ${posY}px, 0)`)
        }}
        autoFocusOnShow={false}
      >
        {isHyperlink && (
          <LinkInfo
            hyperlink={hyperlink}
            onRequestCloseNote={onRequestCloseNote}
            cell={cell}
            sheetId={sheetId}
            onRemoveLink={onRemoveLink}
          />
        )}
        {(content || contentTitle) && (
          <div
            className={clsx(
              'bg-norm grid grid-cols-[1rem_1fr] gap-x-1.5 gap-y-2.5 border-l-2 border-[#DC3251] p-2 pr-2.5',
              content ? 'grid-rows-[auto_1fr]' : 'grid-rows-[auto]',
            )}
          >
            <Icon legacyName="info-circle" className="self-center text-[#DC3251]" />
            <div className="text-xs font-semibold text-[#DC3251]">{contentTitle}</div>
            {content && <div className="text-xs [grid-column:2]">{content}</div>}
          </div>
        )}
        {customContent && (
          <div className="bg-norm flex items-center gap-4 border border-[#239ECE] p-2 pr-2.5">{customContent}</div>
        )}
        {(note || noteEditorCell) && (
          <div className="bg-norm grid grid-cols-[1rem_1fr] grid-rows-[auto_1fr] gap-x-1.5 gap-y-2.5 border-l-2 border-[#F27D00] p-2 pb-1 pr-1">
            <Icon legacyName="note" className="self-center text-[#F27D00]" />
            <div className="text-xs font-semibold text-[#F27D00]">{s('Note')}</div>
            <NoteEditor
              initialValue={note}
              noteEditorCell={noteEditorCell}
              cell={cell}
              onRequestShowNote={onRequestShowNote}
              onRequestUpdateNote={onRequestUpdateNote}
              onRequestCloseNote={onRequestCloseNote}
              className="text-xs [grid-column:2]"
            />
          </div>
        )}
      </Ariakit.Popover>
    </Ariakit.PopoverProvider>
  )
}

interface NoteEditorProps extends ComponentPropsWithoutRef<'textarea'> {
  initialValue: string | undefined
  noteEditorCell: CellInterface | undefined
  cell: CellInterface
  onRequestShowNote: CellTooltipProps['onRequestShowNote'] | undefined
  onRequestUpdateNote: ((value: string | undefined, previousValue: string | undefined) => void) | undefined
  onRequestCloseNote: CellTooltipProps['onRequestCloseNote'] | undefined
}
function NoteEditor({
  initialValue,
  noteEditorCell,
  cell,
  onRequestShowNote,
  onRequestUpdateNote,
  onRequestCloseNote,
  className,
  ...props
}: NoteEditorProps) {
  const [value, setValue] = useState(initialValue ?? '')
  const inputRef = useRef<HTMLTextAreaElement>(null)
  useLayoutEffect(() => {
    if (noteEditorCell) {
      inputRef.current?.focus()
    }
  }, [noteEditorCell])
  return (
    <textarea
      ref={inputRef}
      className={clsx('min-w-72 resize focus:shadow-none focus:outline-none', className)}
      value={value}
      onFocus={() => onRequestShowNote?.(cell)}
      onBlur={() => onRequestUpdateNote?.(value, initialValue)}
      onKeyDown={(e) => {
        if (e.key === 'Escape') {
          onRequestCloseNote?.()
        }
      }}
      onChange={(e) => setValue(e.target.value)}
      {...props}
    />
  )
}

function getLink(hyperlink: NonNullable<CellTooltipProps['hyperlink']>) {
  if (typeof hyperlink === 'string') {
    return hyperlink
  } else if (hyperlink.kind === 'external') {
    return hyperlink.url
  } else {
    return hyperlink.location
  }
}

function LinkInfo({
  hyperlink,
  onRequestCloseNote,
  cell,
  sheetId,
  onRemoveLink,
}: {
  hyperlink: NonNullable<CellTooltipProps['hyperlink']>
  onRequestCloseNote?: () => void
  cell: CellInterface
  sheetId: number
  onRemoveLink: NonNullable<CellTooltipProps['onRemoveLink']>
}) {
  const { application } = useApplication()
  const link = getLink(hyperlink)
  const url = link.startsWith('http') ? link : 'https://' + link
  const isReadonly = useUI((state) => state.info.isReadonly)

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
    <div className="bg-norm grid grid-cols-[1rem_1fr] gap-1.5 border-l-2 border-[#239ECE] p-2.5 pl-2">
      <Icon legacyName="globe" className="place-self-center text-[#239ECE]" />
      <div className="flex items-center justify-between gap-4 text-[#239ECE]">
        <a
          href={url}
          className="max-w-[20ch] text-ellipsis text-xs font-semibold leading-5 underline focus-visible:shadow-none focus-visible:outline-none"
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
          {link}
        </a>
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
      </div>
    </div>
  )
}

function strings() {
  return {
    'Copy link': c('sheets_2025:Spreadsheet link tooltip').t`Copy link`,
    Copied: c('sheets_2025:Spreadsheet link tooltip').t`Link copied to clipboard`,
    'Edit link': c('sheets_2025:Spreadsheet link tooltip').t`Edit link`,
    'Remove link': c('sheets_2025:Spreadsheet link tooltip').t`Remove link`,
    Removed: c('sheets_2025:Spreadsheet link tooltip').t`Link removed`,
    Note: c('sheets_2025:Spreadsheet cell tooltip').t`Note`,
    Error: c('sheets_2025:Spreadsheet cell tooltip').t`Error`,
    Invalid: c('sheets_2025:Spreadsheet cell tooltip').t`Invalid`,
  }
}
