import { SidebarDialog } from './Sidebar'
import { useDataValidationDialogState } from '@rowsncolumns/spreadsheet-state'

export function DataValidationDialog() {
  const [open, setOpen] = useDataValidationDialogState()
  return (
    <SidebarDialog open={open} setOpen={setOpen}>
      <h1>DataValidationDialog</h1>
    </SidebarDialog>
  )
}
