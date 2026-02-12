import { Icon, InputFieldTwo } from '@proton/components'
import { Button } from '@proton/atoms/Button/Button'
import { useUI } from '../../ui-store'
import * as Ariakit from '@ariakit/react'
import { createStringifier } from '../../stringifier'
import { c } from 'ttag'
import { useCallback, useEffect, useMemo, useState } from 'react'
import clsx from '@proton/utils/clsx'

const { s } = createStringifier(strings)

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
      <InputFieldTwo
        autoFocus
        className="text-sm"
        inputClassName="focus-visible:outline-none focus-visible:shadow-none"
        label={s('Insert link')}
        placeholder={s('Paste link')}
        prefix={<Icon name="link" />}
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
        <Button type="button" onClick={insertLink} color="norm">
          {s('Apply')}
        </Button>
        <Button type="button" onClick={useUI.$.view.insertLinkDialog.close}>
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
