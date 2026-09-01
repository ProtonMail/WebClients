import { useUI } from '../../ui-store'
import * as Ariakit from '@ariakit/react'
import { createStringifier } from '../../stringifier'
import { c } from 'ttag'
import { type ComponentPropsWithoutRef, useCallback, useEffect, useId, useMemo, useState } from 'react'
import { clsx } from 'clsx'
import { Button } from '../shared/Button'

const { s } = createStringifier(strings)

function LinkIcon({ className, ...props }: ComponentPropsWithoutRef<'svg'>) {
  return (
    <svg
      viewBox="0 0 16 16"
      focusable="false"
      aria-hidden="true"
      {...props}
      className={clsx('h-4 w-4 text-[--text-norm]', className)}
    >
      <path
        fill="currentColor"
        fillRule="evenodd"
        d="M9.023 2.027a3.5 3.5 0 0 1 4.95 4.95l-2.437 2.437a.5.5 0 1 1-.707-.707l2.437-2.437A2.5 2.5 0 1 0 9.73 2.734L7.293 5.171a.5.5 0 1 1-.707-.707l2.437-2.437Zm1.098 3.852a.5.5 0 0 1 0 .707l-3.535 3.535a.5.5 0 1 1-.708-.707L9.414 5.88a.5.5 0 0 1 .707 0ZM2.03 13.97a3.5 3.5 0 0 0 4.95 0l2.44-2.439a.5.5 0 1 0-.708-.707l-2.44 2.44a2.5 2.5 0 0 1-3.535-3.536l2.44-2.44a.5.5 0 0 0-.707-.707l-2.44 2.44a3.5 3.5 0 0 0 0 4.95Z"
      />
    </svg>
  )
}

interface InsertLinkInputFieldProps extends Omit<ComponentPropsWithoutRef<'input'>, 'prefix'> {
  label: string
}

function InsertLinkInputField({ label, className, ...props }: InsertLinkInputFieldProps) {
  const id = useId()

  return (
    <div className="relative block w-full max-w-full cursor-default">
      <label htmlFor={id} className="mb-1 flex flex-nowrap items-end justify-between gap-2 font-semibold">
        <span className="cursor-pointer">{label}</span>
      </label>
      <div className="relative">
        <div
          className={clsx(
            'relative flex flex-1 flex-nowrap items-stretch rounded-[--border-radius-md] border border-[--field-norm] bg-[--field-background-color] text-[--field-text-color]',
            '[transition:0.15s_cubic-bezier(0.22,1,0.36,1),visibility_0s]',
            'hover:border-[--field-hover] hover:bg-[--field-hover-background-color] hover:text-[--field-hover-text-color]',
            'focus-within:border-[--focus-outline] focus-within:bg-[--field-focus-background-color] focus-within:text-[--field-focus-text-color] focus-within:shadow-[0_0_0_0.1875rem_var(--focus-ring)]',
            className,
          )}
        >
          <div className="ml-3 flex shrink-0 flex-nowrap items-center gap-2 text-[--text-weak]">
            <LinkIcon />
          </div>
          <div className="flex flex-1">
            <input
              id={id}
              autoComplete="off"
              autoCapitalize="off"
              autoCorrect="off"
              spellCheck="false"
              {...props}
              className="bg-transparent min-h-[2.125rem] w-full appearance-none rounded-[--border-radius-md] !border-0 px-[0.75em] py-[0.4375em] ps-[0.5em] text-[inherit] !shadow-none ![outline:none] focus:!shadow-none focus:![outline:none] focus-visible:!shadow-none focus-visible:![outline:none]"
            />
          </div>
        </div>
      </div>
      <div className="mt-1 flex min-h-4 flex-nowrap items-start text-xs text-[--text-weak]" />
    </div>
  )
}

function InsertLinkPopover() {
  const [value, setValue] = useState('')

  const sheetId = useUI((state) => state.legacy.activeSheetId)
  const activeCell = useUI((state) => state.view.insertLinkDialog.cell)
  const selections = useUI((state) => state.legacy.selections)
  const onInsertLink = useUI.$.legacy.onInsertLink
  const onRemoveLink = useUI.$.legacy.onRemoveLink
  const getGridContainerElement = useUI.$.legacy.getGridContainerElement
  const getGridScrollPosition = useUI.$.legacy.getGridScrollPosition
  const getCellOffsetFromCoords = useUI.$.legacy.getCellOffsetFromCoords
  const getHyperlink = useUI.$.legacy.getHyperlink
  const getEffectiveValue = useUI.$.legacy.getEffectiveValue
  const close = useUI.$.view.insertLinkDialog.close

  const cellHyperlink = useMemo(() => {
    return getHyperlink(sheetId, activeCell.rowIndex, activeCell.columnIndex)
  }, [activeCell.columnIndex, activeCell.rowIndex, getHyperlink, sheetId])
  useEffect(() => {
    if (cellHyperlink) {
      if (typeof cellHyperlink === 'string') {
        setValue(cellHyperlink)
      } else if (cellHyperlink.kind === 'external') {
        setValue(cellHyperlink.url)
      } else {
        setValue(cellHyperlink.location)
      }
    }
  }, [cellHyperlink])

  const insertLink = useCallback(() => {
    if (value) {
      let title = ''
      const cellEffectiveValue = getEffectiveValue(sheetId, activeCell.rowIndex, activeCell.columnIndex)
      if (cellEffectiveValue === undefined) {
        title = value
      }
      onInsertLink(sheetId, activeCell, selections, value, title)
    } else {
      onRemoveLink(sheetId, activeCell, selections)
    }
    close()
  }, [activeCell, close, getEffectiveValue, onInsertLink, onRemoveLink, selections, sheetId, value])

  const isOpen = useUI((state) => state.view.insertLinkDialog.isOpen)
  const getAnchorRect = useCallback(() => {
    const gridContainer = getGridContainerElement()
    if (gridContainer) {
      const gridRect = gridContainer.getBoundingClientRect()
      const cellOffset = getCellOffsetFromCoords(activeCell)
      if (cellOffset) {
        const scrollPos = getGridScrollPosition() || { scrollLeft: 0, scrollTop: 0 }
        return {
          x: cellOffset.x + gridRect.left - scrollPos.scrollLeft,
          y: cellOffset.y + gridRect.top - scrollPos.scrollTop,
          width: cellOffset.width,
          height: cellOffset.height,
        }
      }
    }
    return null
  }, [activeCell, getCellOffsetFromCoords, getGridContainerElement, getGridScrollPosition])

  return (
    <Ariakit.Popover
      unmountOnHide
      portal={false}
      onClose={close}
      className={clsx(
        'z-10 w-[320px] rounded-[8px] border border-[#D1CFCD] bg-[white] p-6 shadow-[0px_8px_24px_0px_rgba(0,0,0,0.16)] outline-none',
        !isOpen && 'opacity-0', // without this, the popover briefly appears on whatever other cell you might have clicked
      )}
      getAnchorRect={getAnchorRect}
      gutter={4}
    >
      <InsertLinkInputField
        autoFocus
        className="text-sm"
        label={s('Insert link')}
        placeholder={s('Paste link')}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault()
            insertLink()
          } else if (e.key === 'Escape') {
            e.preventDefault()
            close()
          }
        }}
      />
      <div className="flex items-center gap-2 text-sm">
        <Button type="button" className="!px-[.9375rem] !py-[.4375rem]" onClick={insertLink} color="norm">
          {s('Apply')}
        </Button>
        <Button type="button" className="!px-[.9375rem] !py-[.4375rem]" onClick={useUI.$.view.insertLinkDialog.close}>
          {s('Cancel')}
        </Button>
      </div>
    </Ariakit.Popover>
  )
}

export function InsertLinkDialog() {
  const popover = Ariakit.usePopoverStore({
    open: useUI((state) => state.view.insertLinkDialog.isOpen),
    placement: 'bottom-start',
  })
  const mounted = Ariakit.useStoreState(popover, 'mounted')
  return <Ariakit.PopoverProvider store={popover}>{mounted && <InsertLinkPopover />}</Ariakit.PopoverProvider>
}

function strings() {
  return {
    'Insert link': c('sheets_2025:Spreadsheet insert link dialog').t`Insert link`,
    'Paste link': c('sheets_2025:Spreadsheet insert link dialog').t`Paste link`,
    Apply: c('sheets_2025:Spreadsheet insert link dialog').t`Apply`,
    Cancel: c('sheets_2025:Spreadsheet insert link dialog').t`Cancel`,
  }
}
