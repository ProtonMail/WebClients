import { ConditionalFormatEditor, useConditionalFormatDialogState } from '@rowsncolumns/spreadsheet-state'
import type { ConditionalFormatEditorProps } from '@rowsncolumns/spreadsheet-state'
import { SidebarDialog, SidebarDialogHeader } from './SidebarDialog'

export function ConditionalFormatDialog(props: ConditionalFormatEditorProps) {
  const [open, setOpen] = useConditionalFormatDialogState()

  return (
    <SidebarDialog open={open} setOpen={setOpen}>
      <div className="flex h-full min-h-0 flex-col">
        <SidebarDialogHeader title="Conditional formatting" />
        <div className="grow overflow-y-auto p-4">
          <ConditionalFormatEditor {...props} />
        </div>
      </div>
    </SidebarDialog>
  )
}
