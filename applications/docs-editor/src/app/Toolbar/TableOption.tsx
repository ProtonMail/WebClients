/* eslint-disable jsx-a11y/label-has-associated-control */
import { ToolbarButton } from './ToolbarButton'
import TableIcon from '../Icons/TableIcon'
import { SimpleDropdown } from '@proton/components'
import { Button, Input } from '@proton/atoms'
import { LexicalEditor } from 'lexical'
import { INSERT_TABLE_COMMAND } from '@lexical/table'
import { c } from 'ttag'

export function TableOption({ editor, disabled }: { editor: LexicalEditor; disabled: boolean }) {
  return (
    <>
      <SimpleDropdown
        as={ToolbarButton}
        label={c('Title').t`Insert table`}
        disabled={disabled}
        content={<TableIcon className="h-4 w-4 fill-current" />}
        hasCaret={false}
        autoClose={false}
      >
        <form
          className="flex flex-col gap-2 px-3 py-2 text-sm"
          onSubmit={(event) => {
            event.preventDefault()
            if (!editor.isEditable()) {
              return
            }
            const form = event.currentTarget
            const rows = Math.min(Math.max(parseInt(form.rows.value), 0), 10).toString()
            const columns = Math.min(Math.max(parseInt(form.columns.value), 0), 10).toString()
            editor.dispatchCommand(INSERT_TABLE_COMMAND, { rows, columns })
          }}
        >
          <label className="flex items-center justify-between gap-3">
            {c('Info').t`Rows`}
            <Input type="number" name="rows" className="max-w-[10ch]" defaultValue={2} />
          </label>
          <label className="flex items-center justify-between gap-3">
            {c('Info').t`Columns`}
            <Input type="number" name="columns" className="max-w-[10ch]" defaultValue={3} />
          </label>
          <div>
            <Button type="submit">{c('Action').t`Insert table`}</Button>
          </div>
        </form>
      </SimpleDropdown>
    </>
  )
}
