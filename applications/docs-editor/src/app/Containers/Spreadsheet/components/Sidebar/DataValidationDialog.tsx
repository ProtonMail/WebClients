import {
  DataValidationEditor,
  useDataValidationDialogState,
  type UseSpreadsheetProps,
  type useSpreadsheetState,
} from '@rowsncolumns/spreadsheet-state'
import { SidebarDialog, SidebarDialogHeader } from './SidebarDialog'
import type { CanvasGridProps, DataValidationRuleRecord } from '@rowsncolumns/spreadsheet'

interface DataValidationEditorProps {
  dataValidations?: DataValidationRuleRecord[]
  sheetId: number
  functionDescriptions?: CanvasGridProps['functionDescriptions']
  onDeleteRules: ReturnType<typeof useSpreadsheetState>['onDeleteDataValidationRules']
  onUpdateRule: ReturnType<typeof useSpreadsheetState>['onUpdateDataValidationRule']
  onCreateRule: ReturnType<typeof useSpreadsheetState>['onCreateDataValidationRule']
  onDeleteRule: ReturnType<typeof useSpreadsheetState>['onDeleteDataValidationRule']
  idCreationStrategy?: UseSpreadsheetProps['idCreationStrategy']
}

interface DataValidationDialogProps extends DataValidationEditorProps {}

export function DataValidationDialog(props: DataValidationDialogProps) {
  const [open, setOpen] = useDataValidationDialogState()

  return (
    <SidebarDialog open={open} setOpen={setOpen}>
      <div className="flex h-full min-h-0 flex-col">
        <SidebarDialogHeader title="Data Validation" />
        <div className="grow overflow-y-auto p-4">
          <DataValidationEditor {...props} />
        </div>
      </div>
    </SidebarDialog>
  )
}
