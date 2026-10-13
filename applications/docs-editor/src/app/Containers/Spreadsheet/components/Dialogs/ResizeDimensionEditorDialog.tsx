import { useSheetsMessages } from '../../SheetsDependenciesProvider'
import * as Ariakit from '@ariakit/react'
import { clsx } from 'clsx'
import { FormGroup, Input } from '../Sidebar/shared'

import {
  type ResizeDimensionState,
  useResizeDimensionDialogState,
  useResizeDimensionValue,
} from '@rowsncolumns/spreadsheet-state'
import { generateMultiDimTitle, useSpreadsheetApi } from '@rowsncolumns/spreadsheet'
import { useUI } from '../../ui-store'
import { Button } from '../shared/Button'

interface ResizeDimensionEditorProps {
  resizeDimension: ResizeDimensionState
}

function ResizeDimensionEditor({ resizeDimension }: ResizeDimensionEditorProps) {
  const messages = useSheetsMessages()

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
            {axis === 'y'
              ? messages.resizeDimensionEditorDialog.resizeColumns(generateMultiDimTitle(indexes, axis) ?? '')
              : messages.resizeDimensionEditorDialog.resizeRows(generateMultiDimTitle(indexes, axis) ?? '')}
          </Ariakit.DialogHeading>
        </div>

        <form onSubmit={onSubmit}>
          <FormGroup>
            <label htmlFor="size" className="text-sm">
              {axis === 'y'
                ? messages.resizeDimensionEditorDialog.specifyColumnWidth
                : messages.resizeDimensionEditorDialog.specifyRowHeight}
            </label>
            <Input
              id="size"
              name="size"
              type="number"
              min="0"
              defaultValue={defaultDimension}
              placeholder={messages.resizeDimensionEditorDialog.defaultSize(defaultDimension ?? 0)}
            />
          </FormGroup>

          <div className="mt-4 flex items-center justify-end gap-2 text-sm">
            <Ariakit.DialogDismiss render={<Button type="button" className="!px-[.9375rem] !py-[.4375rem]" />}>
              {messages.resizeDimensionEditorDialog.Cancel}
            </Ariakit.DialogDismiss>
            <Button type="submit" color="norm" className="!px-[.9375rem] !py-[.4375rem]">
              {messages.resizeDimensionEditorDialog.OK}
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

export const resizeDimensionEditorDialogMessages = {
  resizeDimensionEditorDialog: {
    resizeColumns: (title: string) => `Resize column ${title}`,
    resizeRows: (title: string) => `Resize row ${title}`,
    specifyColumnWidth: 'Specify column width (px)',
    specifyRowHeight: 'Specify row height (px)',
    defaultSize: (size: number) => `Default ${size}`,
    OK: `OK`,
    Cancel: `Cancel`,
  },
}
