import { useConfirmActionModal } from '@proton/components/components/confirmActionModal/ConfirmActionModal'
import { useUI } from '../../ui-store'
import { c } from 'ttag'
import { useEffect } from 'react'

export function DeleteSheetDialog() {
  const [confirmModal, showConfirmModal] = useConfirmActionModal()

  const sheetId = useUI((ui) => ui.view.deleteSheetConfirmation.sheetId)
  const deleteSheet = useUI.$.sheets.delete
  const getSheetName = useUI.$.legacy.getSheetName
  const closeDeleteSheetDialog = useUI.$.view.deleteSheetConfirmation.close
  useEffect(() => {
    if (sheetId) {
      const sheetName = getSheetName(sheetId)
      showConfirmModal({
        title: c('sheets_2025:Spreadsheet delete sheet dialog').t`Delete sheet`,
        message: c('sheets_2025:Spreadsheet delete sheet dialog').t`Are you sure you want to delete ${sheetName}?`,
        canUndo: true,
        submitText: c('sheets_2025:Spreadsheet delete sheet dialog').t`Delete`,
        cancelText: c('sheets_2025:Spreadsheet delete sheet dialog').t`Cancel`,
        onSubmit: async () => {
          deleteSheet(sheetId)
        },
        onCancel: () => {
          closeDeleteSheetDialog()
        },
      })
    }
  }, [closeDeleteSheetDialog, deleteSheet, getSheetName, sheetId, showConfirmModal])

  return <>{confirmModal}</>
}
