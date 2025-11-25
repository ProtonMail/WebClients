import { c } from 'ttag'
import { createStringifier } from '../../stringifier'
import { SidebarDialog, SidebarDialogHeader } from './SidebarDialog'
import { useEditTableDialogState, useEditingTable } from '@rowsncolumns/spreadsheet-state'
import { findMatchingBandProperty, FormulaInput, type TableView, useFormulaInputState } from '@rowsncolumns/spreadsheet'
import { Button, FormCheckbox, FormGroup, FormLabel, Input } from './shared'
import * as Ariakit from '@ariakit/react'
import { type SubmitHandler, useForm } from 'react-hook-form'
import { useUI } from '../../ui-store'

const { s } = createStringifier(strings)

interface TableEditorProps {
  table: TableView
  onDone: () => void
}

function TableEditor({ table, onDone }: TableEditorProps) {
  const sheetId = useUI((ui) => ui.legacy.activeSheetId)
  const theme = useUI((ui) => ui.legacy.theme)
  const onUpdateTable = useUI((ui) => ui.legacy.onUpdateTable)
  const form = useForm({ defaultValues: table })
  const formValues = form.watch()
  const { title, showRowStripes = true, showColumnStripes = false, filterButton = true, range } = formValues
  const formulaInput = useFormulaInputState(sheetId, { ...range, sheetId })

  const onSubmit: SubmitHandler<TableView> = (values) => {
    const tableTheme = values.theme ?? 'TableStyleLight1'
    let bandedRange = values.bandedRange
    if (table.showRowStripes !== showRowStripes || table.showColumnStripes !== showColumnStripes) {
      bandedRange = findMatchingBandProperty(
        tableTheme,
        showRowStripes ?? undefined,
        showColumnStripes ?? undefined,
        theme,
      )
      if (!showColumnStripes) {
        delete bandedRange?.columnProperties
      }
    }

    const newTable: TableView = {
      ...values,
      bandedRange,
    }
    onUpdateTable(sheetId, newTable.id, newTable)
    onDone()
  }

  return (
    <form className="flex min-h-0 grow flex-col" onSubmit={form.handleSubmit(onSubmit)}>
      <div className="grow overflow-y-auto px-4">
        <div className="flex flex-col gap-4 py-4">
          <div className="flex flex-col gap-4">
            <FormGroup>
              <FormLabel>{s('Table title')}</FormLabel>
              <Input
                value={title}
                required
                onChange={(event) => {
                  form.setValue('title', event.target.value)
                }}
              />
            </FormGroup>

            <FormGroup>
              <FormLabel>{s('Table data range')}</FormLabel>
              <div className="flex items-center">
                <FormulaInput
                  onChange={(value) => {
                    formulaInput.onChange(value, (parsed) => {
                      form.setValue('range', parsed)
                    })
                  }}
                  value={formulaInput.value}
                  required
                  placeholder={s('Select a range')}
                  autoFocus
                  className="mb-0 w-full"
                />
              </div>
            </FormGroup>
          </div>

          <div className="flex flex-col gap-4 border-t border-[#EAE7E4] py-2.5">
            <FormGroup>
              <FormLabel>{s('More settings')}</FormLabel>

              <Ariakit.CheckboxProvider
                value={showRowStripes ?? false}
                setValue={(checked) => {
                  form.setValue('showRowStripes', checked)
                }}
              >
                <FormCheckbox>{s('Banded rows')}</FormCheckbox>
              </Ariakit.CheckboxProvider>

              <Ariakit.CheckboxProvider
                value={showColumnStripes ?? false}
                setValue={(checked) => {
                  form.setValue('showColumnStripes', checked)
                }}
              >
                <FormCheckbox>{s('Banded columns')}</FormCheckbox>
              </Ariakit.CheckboxProvider>

              <Ariakit.CheckboxProvider
                value={filterButton ?? false}
                setValue={(checked) => {
                  form.setValue('filterButton', checked)
                }}
              >
                <FormCheckbox>{s('Show filter button')}</FormCheckbox>
              </Ariakit.CheckboxProvider>
            </FormGroup>
          </div>
        </div>
      </div>

      <div className="mt-auto flex shrink-0 items-center justify-end gap-2 border-t-[0.5px] border-[#EAE7E4] px-4 py-2">
        <Button
          type="button"
          className="inline-flex h-[36px] items-center gap-1.5 rounded-lg border border-[#DEDBD9] px-4 text-[13px]"
          onClick={onDone}
        >
          {s('Cancel')}
        </Button>
        <Button
          type="submit"
          className="inline-flex h-[36px] items-center gap-1.5 rounded-lg bg-[#6D4AFF] px-4 text-[13px] text-[white]"
        >
          {s('Save')}
        </Button>
      </div>
    </form>
  )
}

interface TableEditorRootProps {
  onDone: () => void
}

function TableEditorRoot({ onDone }: TableEditorRootProps) {
  const table = useEditingTable()

  if (!table) {
    return null
  }

  return <TableEditor key={table.id} table={table} onDone={onDone} />
}

export function TableEditorDialog() {
  const [open, setOpen] = useEditTableDialogState()

  return (
    <SidebarDialog open={open} setOpen={setOpen}>
      <div className="flex h-full min-h-0 flex-col">
        <SidebarDialogHeader title={s('Edit table')} />
        <TableEditorRoot onDone={() => setOpen(false)} />
      </div>
    </SidebarDialog>
  )
}

function strings() {
  return {
    'Edit table': c('sheets_2025:Spreadsheet sidebar table editor dialog').t`Edit table`,
    'Table title': c('sheets_2025:Spreadsheet sidebar table editor dialog').t`Table title`,
    'Table data range': c('sheets_2025:Spreadsheet sidebar table editor dialog').t`Table data range`,
    'Select a range': c('sheets_2025:Spreadsheet sidebar table editor dialog').t`Select a range`,
    'More settings': c('sheets_2025:Spreadsheet sidebar table editor dialog').t`More settings`,
    'Banded rows': c('sheets_2025:Spreadsheet sidebar table editor dialog').t`Banded rows`,
    'Banded columns': c('sheets_2025:Spreadsheet sidebar table editor dialog').t`Banded columns`,
    'Show filter button': c('sheets_2025:Spreadsheet sidebar table editor dialog').t`Show filter button`,
    Cancel: c('sheets_2025:Spreadsheet sidebar table editor dialog').t`Cancel`,
    Save: c('sheets_2025:Spreadsheet sidebar table editor dialog').t`Save`,
  }
}
