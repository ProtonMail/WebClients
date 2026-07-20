import { useUI } from '../../ui-store'
import * as Ariakit from '@ariakit/react'
import { c } from 'ttag'
import { Button } from '../shared/Button'

export function DeleteSheetDialog() {
  const sheetId = useUI((ui) => ui.view.deleteSheetConfirmation.sheetId)
  const deleteSheet = useUI.$.sheets.delete
  const getSheetName = useUI.$.legacy.getSheetName
  const closeDeleteSheetDialog = useUI.$.view.deleteSheetConfirmation.close

  if (!sheetId) {
    return null
  }

  const sheetName = getSheetName(sheetId)

  const onSubmit: React.FormEventHandler<HTMLFormElement> = (event) => {
    event.preventDefault()
    deleteSheet(sheetId)
    closeDeleteSheetDialog()
  }

  return (
    <Ariakit.DialogProvider>
      <Ariakit.Dialog
        portal={false}
        backdrop={false}
        modal={false}
        open
        onClose={closeDeleteSheetDialog}
        unmountOnHide
        render={<form onSubmit={onSubmit} />}
        className="fixed inset-0 z-10 m-auto h-fit w-96 rounded-xl border border-[#D1CFCD] bg-[white] p-6 shadow-[0px_8px_24px_0px_rgba(0,0,0,0.16)] outline-none"
      >
        <div className="mb-4">
          <Ariakit.DialogHeading className="text-xl font-bold">
            {c('sheets_2025:Spreadsheet delete sheet dialog').t`Delete sheet`}
          </Ariakit.DialogHeading>
        </div>

        <div className="mb-6">
          {c('sheets_2025:Spreadsheet delete sheet dialog').t`Are you sure you want to delete ${sheetName}?`}
        </div>

        <div className="flex items-center justify-end gap-2 text-sm">
          <Ariakit.DialogDismiss render={<Button type="button" className="!px-[.9375rem] !py-[.4375rem]" />}>
            {c('sheets_2025:Spreadsheet delete sheet dialog').t`Cancel`}
          </Ariakit.DialogDismiss>
          <Button
            type="submit"
            className="!border-transparent !bg-[--signal-danger] !px-[.9375rem] !py-[.4375rem] !text-[white] hover:!bg-[--signal-danger-major-1] active:!bg-[--signal-danger-major-2]"
          >
            {c('sheets_2025:Spreadsheet delete sheet dialog').t`Delete`}
          </Button>
        </div>
      </Ariakit.Dialog>
    </Ariakit.DialogProvider>
  )
}
