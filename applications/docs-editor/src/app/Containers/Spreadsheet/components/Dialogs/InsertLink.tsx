import { Icon, InputFieldTwo } from '@proton/components'
import { Button } from '@proton/atoms/Button/Button'
import { useUI } from '../../ui-store'
import * as Ariakit from '@ariakit/react'
import { createStringifier } from '../../stringifier'
import { c } from 'ttag'
import { useCallback, useEffect, useMemo, useState } from 'react'
import clsx from '@proton/utils/clsx'
import { Select, SelectItem, SelectPopover } from '../Sidebar/shared'
import { createSheetLink, parseSheetLink } from './sheetLink'

const { s } = createStringifier(strings)

type LinkMode = 'url' | 'sheet'

function getLinkString(hyperlink: unknown): string {
  if (!hyperlink) return ''
  if (typeof hyperlink === 'string') return hyperlink
  const h = hyperlink as { kind?: string; url?: string; location?: string }
  if (h.kind === 'external' && h.url) return h.url
  if (h.location) return h.location
  return ''
}

function InsertLinkPopover() {
  const [mode, setMode] = useState<LinkMode>('url')
  const [urlValue, setUrlValue] = useState('')
  const [targetSheetId, setTargetSheetId] = useState<string>('')

  const sheetId = useUI((state) => state.legacy.activeSheetId)
  const activeCell = useUI((state) => state.view.insertLinkDialog.cell)
  const selections = useUI((state) => state.legacy.selections)
  const sheets = useUI((state) => state.sheets.list)
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

  // Populate form from the existing cell hyperlink, or default to the first sheet.
  // Merged into one effect to prevent the defaulting branch from racing with and
  // overwriting the parsed sheet ID when both effects fire in the same flush.
  useEffect(() => {
    const linkStr = getLinkString(cellHyperlink)
    if (linkStr) {
      const parsed = parseSheetLink(linkStr)
      if (parsed) {
        setMode('sheet')
        setTargetSheetId(String(parsed.sheetId))
      } else {
        setMode('url')
        setUrlValue(linkStr)
      }
    } else if (sheets.length > 0) {
      setTargetSheetId((current) => (current ? current : String(sheets[0].id)))
    }
  }, [cellHyperlink, sheets])

  const insertLink = useCallback(() => {
    let value: string

    if (mode === 'sheet') {
      value = targetSheetId ? createSheetLink(Number(targetSheetId)) : ''
    } else {
      value = urlValue
    }

    if (value) {
      let title = ''
      const cellEffectiveValue = getEffectiveValue(sheetId, activeCell.rowIndex, activeCell.columnIndex)
      if (cellEffectiveValue === undefined) {
        if (mode === 'sheet') {
          const targetSheet = sheets.find((sh) => sh.id === Number(targetSheetId))
          title = targetSheet?.name ?? value
        } else {
          title = value
        }
      }
      onInsertLink(sheetId, activeCell, selections, value, title)
    } else {
      onRemoveLink(sheetId, activeCell, selections)
    }

    close()
  }, [
    activeCell,
    close,
    getEffectiveValue,
    mode,
    onInsertLink,
    onRemoveLink,
    selections,
    sheetId,
    sheets,
    targetSheetId,
    urlValue,
  ])

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
        !isOpen && 'opacity-0',
      )}
      getAnchorRect={getAnchorRect}
      gutter={4}
    >
      {/* Mode toggle */}
      <div className="mb-4 flex rounded-lg border border-[#EAE7E4] p-0.5 text-sm">
        <button
          type="button"
          onClick={() => setMode('url')}
          className={clsx(
            'flex-1 rounded-md py-1.5 text-xs font-medium transition',
            mode === 'url' ? 'bg-[#6D4AFF] text-white' : 'text-[#281D1B] hover:bg-[#F5F4F2]',
          )}
        >
          {s('Web link')}
        </button>
        <button
          type="button"
          onClick={() => setMode('sheet')}
          className={clsx(
            'flex-1 rounded-md py-1.5 text-xs font-medium transition',
            mode === 'sheet' ? 'bg-[#6D4AFF] text-white' : 'text-[#281D1B] hover:bg-[#F5F4F2]',
          )}
        >
          {s('Sheet in this file')}
        </button>
      </div>

      {mode === 'url' ? (
        <InputFieldTwo
          autoFocus
          className="text-sm"
          inputClassName="focus-visible:outline-none focus-visible:shadow-none"
          label={s('Insert link')}
          placeholder={s('Paste link')}
          prefix={<Icon name="link" />}
          value={urlValue}
          onChange={(e) => setUrlValue(e.target.value)}
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
      ) : (
        <div className="mb-4 flex flex-col gap-2">
          <label className="text-sm font-semibold text-[#281D1B]">{s('Select sheet')}</label>
          {sheets.length === 0 ? (
            <p className="text-xs text-[#8F8D8A]">{s('No sheets available')}</p>
          ) : (
            <Ariakit.SelectProvider value={targetSheetId} setValue={setTargetSheetId}>
              <Select className="w-full" />
              <SelectPopover sameWidth>
                <Ariakit.SelectGroup className="py-2">
                  {sheets.map((sheet) => (
                    <SelectItem key={sheet.id} value={String(sheet.id)}>
                      {sheet.name}
                    </SelectItem>
                  ))}
                </Ariakit.SelectGroup>
              </SelectPopover>
            </Ariakit.SelectProvider>
          )}
        </div>
      )}

      <div className="flex items-center gap-2 text-sm">
        <Button type="button" onClick={insertLink} color="norm">
          {s('Apply')}
        </Button>
        <Button type="button" onClick={close}>
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
    'Web link': c('sheets_2025:Spreadsheet insert link dialog').t`Web link`,
    'Sheet in this file': c('sheets_2025:Spreadsheet insert link dialog').t`Sheet in this file`,
    'Select sheet': c('sheets_2025:Spreadsheet insert link dialog').t`Select sheet`,
    'No sheets available': c('sheets_2025:Spreadsheet insert link dialog').t`No sheets available`,
  }
}
