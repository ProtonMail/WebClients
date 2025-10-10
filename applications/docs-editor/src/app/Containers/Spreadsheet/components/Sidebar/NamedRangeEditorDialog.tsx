import { useEditNamedRangeDialogState } from '@rowsncolumns/spreadsheet-state'
import { SidebarDialog } from './SidebarDialog'

export function NamedRangeEditorDialog() {
  const [open, setOpen] = useEditNamedRangeDialogState()
  return (
    <SidebarDialog open={open} setOpen={setOpen}>
      <h1>NamedRangeEditorDialog</h1>
    </SidebarDialog>
  )
}
