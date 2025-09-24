import { SidebarDialog } from './Sidebar'
import { useEditNamedRangeDialogState } from '@rowsncolumns/spreadsheet-state'

export function NamedRangeEditorDialog() {
  const [open, setOpen] = useEditNamedRangeDialogState()
  return (
    <SidebarDialog open={open} setOpen={setOpen}>
      <h1>NamedRangeEditorDialog</h1>
    </SidebarDialog>
  )
}
