import { useConditionalFormatDialogState } from '@rowsncolumns/spreadsheet-state'
import { SidebarDialog } from './Sidebar'

export function ConditionalFormatDialog() {
  const [open, setOpen] = useConditionalFormatDialogState()
  return (
    <SidebarDialog open={open} setOpen={setOpen}>
      <h1>ConditionalFormatDialog</h1>
    </SidebarDialog>
  )
}
