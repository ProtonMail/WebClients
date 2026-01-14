import * as Ariakit from '@ariakit/react'
import clsx from '@proton/utils/clsx'
import { FormGroup, Input } from '../Sidebar/shared'
import { Button } from '@proton/atoms/Button/Button'
import { createStringifier } from '../../stringifier'
import { c } from 'ttag'
import {
  type ResizeDimensionState,
  useResizeDimensionDialogState,
  useResizeDimensionValue,
} from '@rowsncolumns/spreadsheet-state'
import { generateMultiDimTitle, useSpreadsheetApi } from '@rowsncolumns/spreadsheet'
import { useUI } from '../../ui-store'

const { s } = createStringifier(strings)

interface ResizeDimensionEditorProps {
  resizeDimension: ResizeDimensionState
}

function ResizeDimensionEditor({ resizeDimension }: ResizeDimensionEditorProps) {
  const [open, setOpen] = useResizeDimensionDialogState()
  const onResize = useUI((ui) => ui.legacy.onResize)
  const { axis, indexes, sheetId } = resizeDimension
  const api = useSpreadsheetApi()
  const defaultDimension =
    axis === 'y' ? api?.getSheet(sheetId).getColumnWidth(indexes[0]) : api?.getSheet(sheetId).getRowHeight(indexes[0])

  const onSubmit: React.FormEventHandler<HTMLFormElement> = (event) => {
    event.preventDefault()

    const formData = new FormData(event.currentTarget)
    const size = formData.get('size')
    onResize?.(sheetId, indexes, size as unknown as number, axis, false)
    setOpen(false)
  }

  return (
    <Ariakit.DialogProvider>
      <Ariakit.Dialog
        portal={false}
        backdrop={false}
        modal={false}
        open={open}
        onClose={() => setOpen(false)}
        unmountOnHide
        className={clsx(
          'fixed inset-0 z-10 m-auto h-fit w-96 bg-[white]',
          'rounded-xl p-6',
          'border border-[#D1CFCD] shadow-[0px_8px_24px_0px_rgba(0,0,0,0.16)] outline-none',
        )}
      >
        <div className="mb-6">
          <Ariakit.DialogHeading className="text-xl font-bold">
            Resize {axis === 'y' ? s('column') : s('row')} {generateMultiDimTitle(indexes, axis)}
          </Ariakit.DialogHeading>
        </div>

        <form onSubmit={onSubmit}>
          <FormGroup>
            <label htmlFor="size" className="text-sm">
              Specify {axis === 'y' ? s('column width') : s('row height')} (px)
            </label>
            <Input
              id="size"
              name="size"
              type="number"
              min="0"
              defaultValue={defaultDimension}
              placeholder={`${s('Default')} ${defaultDimension}`}
            />
          </FormGroup>

          <div className="mt-4 flex items-center justify-end gap-2 text-sm">
            <Ariakit.DialogDismiss render={<Button type="button" />}>{s('Cancel')}</Ariakit.DialogDismiss>
            <Button type="submit" color="norm">
              {s('OK')}
            </Button>
          </div>
        </form>
      </Ariakit.Dialog>
    </Ariakit.DialogProvider>
  )
}

export function ResizeDimensionEditorDialog() {
  const resizeDimension = useResizeDimensionValue()
  if (!resizeDimension) {
    return null
  }

  return <ResizeDimensionEditor resizeDimension={resizeDimension} />
}

function strings() {
  return {
    column: c('sheets_2025:Spreadsheet resize dimension dialog').t`column`,
    row: c('sheets_2025:Spreadsheet resize dimension dialog').t`row`,
    'column width': c('sheets_2025:Spreadsheet resize dimension dialog').t`column width`,
    'row height': c('sheets_2025:Spreadsheet resize dimension dialog').t`row height`,
    Default: c('sheets_2025:Spreadsheet resize dimension dialog').t`Default`,
    OK: c('sheets_2025:Spreadsheet resize dimension dialog').t`OK`,
    Cancel: c('sheets_2025:Spreadsheet resize dimension dialog').t`Cancel`,
  }
}
