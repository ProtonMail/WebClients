import {
  ProtonNamedRangeEditor,
  useEditNamedRangeDialogState,
  type UseSpreadsheetProps,
  type useSpreadsheetState,
} from '@rowsncolumns/spreadsheet-state'
import { SidebarDialog, SidebarDialogHeader } from './SidebarDialog'

type NamedRangeEditorDialogProps = {
  sheetId: number
  onUpdateNamedRange?: ReturnType<typeof useSpreadsheetState>['onUpdateNamedRange']
  onCreateNamedRange?: ReturnType<typeof useSpreadsheetState>['onCreateNamedRange']
  idCreationStrategy?: UseSpreadsheetProps['idCreationStrategy']
}

export function NamedRangeEditorDialog(props: NamedRangeEditorDialogProps) {
  const [open, setOpen] = useEditNamedRangeDialogState()
  return (
    <SidebarDialog open={open} setOpen={setOpen}>
      <div className="flex h-full min-h-0 flex-col">
        <SidebarDialogHeader title="Named Ranges" />
        <div className="grow overflow-y-auto p-4">
          <ProtonNamedRangeEditor {...props} onDone={() => setOpen(false)} />
        </div>
      </div>
    </SidebarDialog>
  )
}
