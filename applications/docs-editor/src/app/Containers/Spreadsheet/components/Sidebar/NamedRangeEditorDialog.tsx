import {
  useEditingNamedRange,
  useEditNamedRangeDialogState,
  type UseSpreadsheetProps,
  type useSpreadsheetState,
} from '@rowsncolumns/spreadsheet-state'
import {
  FormulaInput,
  type SheetRange,
  useFormulaRangeHelpers,
  type NamedRange,
  useSpreadsheetApi,
} from '@rowsncolumns/spreadsheet'
import { uuid } from '@rowsncolumns/utils'
import * as Ariakit from '@ariakit/react'
import { SidebarDialog, SidebarDialogHeader } from './SidebarDialog'
import { Button, FormGroup, FormLabel, FormRadio, Input } from './shared'
import { Icon } from '../ui'
import { Fragment, useMemo, useRef, useState } from 'react'
import { c } from 'ttag'
import { useForm, type SubmitHandler } from 'react-hook-form'
import { createStringifier } from '../../stringifier'
import { GenerateUUID } from '@proton/docs-shared'
import { useUI } from '../../ui-store'
import { useEvent } from '../utils'

const { s } = createStringifier(strings)

interface NamedRangeListItemProps {
  namedRange: NamedRange
  sheetId: number
  onDeleteNamedRange: (id: NamedRange['namedRangeId']) => void
  onSelect: () => void
}

function NamedRangeListItem({ namedRange, sheetId, onDeleteNamedRange, onSelect }: NamedRangeListItemProps) {
  const { rangeToAddress } = useFormulaRangeHelpers({ sheetId })

  return (
    <Button render={<div />} onClick={onSelect} className="px-4 hover:bg-[#C2C1C033]/20">
      <div className="flex items-center border-b-[0.5px] border-[#EAE7E4] py-3">
        <div className="flex min-w-0 grow flex-col">
          <p className="text-sm font-semibold">{namedRange.name}</p>
          {namedRange.range ? <span className="text-sm">{rangeToAddress(namedRange.range)}</span> : null}
        </div>

        <Button
          type="button"
          className="flex size-[36px] shrink-0 items-center justify-center rounded-lg"
          aria-label={s('Delete named range')}
          onClick={(event) => {
            event.stopPropagation()
            onDeleteNamedRange(namedRange.namedRangeId)
          }}
        >
          <Icon legacyName="trash" />
        </Button>
      </div>
    </Button>
  )
}

interface NamedRangesListProps {
  namedRanges: NamedRange[]
  sheetId: number
  onDeleteNamedRange: (id: NamedRange['namedRangeId']) => void
  onSelectNamedRange: (namedRange: NamedRange) => void
  onNewNamedRange: () => void
}

function NamedRangesList({
  namedRanges,
  sheetId,
  onDeleteNamedRange,
  onSelectNamedRange,
  onNewNamedRange,
}: NamedRangesListProps) {
  return (
    <div className="min-h-0 grow overflow-y-auto">
      <div className="flex flex-col empty:hidden">
        {namedRanges.map((namedRange) => (
          <NamedRangeListItem
            key={namedRange.namedRangeId}
            namedRange={namedRange}
            sheetId={sheetId}
            onDeleteNamedRange={onDeleteNamedRange}
            onSelect={() => onSelectNamedRange(namedRange)}
          />
        ))}
      </div>

      <div className="px-4 py-2">
        <Button
          type="button"
          className="inline-flex h-[36px] items-center gap-1.5 rounded-lg border border-[#DEDBD9] px-4 text-[13px]"
          onClick={onNewNamedRange}
        >
          <Icon legacyName="plus" />
          {namedRanges.length > 0 ? s('Add another named range') : s('Add named range')}
        </Button>
      </div>
    </div>
  )
}

const NamedRangeTypes = {
  Range: 'Range',
  TextOrFormula: 'TextOrFormula',
} as const
type NamedRangeType = (typeof NamedRangeTypes)[keyof typeof NamedRangeTypes]

interface NamedRangeEditorProps {
  namedRange: NamedRange
  sheetId: number
  onDone: () => void
  onNewNamedRange: () => void
  onUpdateNamedRange: ReturnType<typeof useSpreadsheetState>['onUpdateNamedRange']
  setNamedRangesState: React.Dispatch<React.SetStateAction<NamedRangesState>>
  onCreateNamedRange: ReturnType<typeof useSpreadsheetState>['onCreateNamedRange']
  idCreationStrategy?: UseSpreadsheetProps['idCreationStrategy']
}

function NamedRangeEditor({
  namedRange,
  sheetId,
  onCreateNamedRange,
  onUpdateNamedRange,
  onDone,
  onNewNamedRange,
  idCreationStrategy,
}: NamedRangeEditorProps) {
  const mode = namedRange.namedRangeId === 'new' ? 'CREATE' : 'UPDATE'
  const form = useForm({ defaultValues: namedRange })
  const { range, value } = form.watch()
  const addAnotherButtonRef = useRef<HTMLButtonElement | null>(null)
  const { formulaToRange, rangeToAddress } = useFormulaRangeHelpers({ sheetId })

  const onSubmit: SubmitHandler<NamedRange> = (data, event) => {
    if (mode === 'CREATE') {
      const newNamedRange: NamedRange = { ...data, namedRangeId: idCreationStrategy?.('named-range') ?? uuid() }
      onCreateNamedRange(sheetId, newNamedRange)
    } else if (mode === 'UPDATE') {
      onUpdateNamedRange(sheetId, data, namedRange)
    }

    const addAnother =
      event?.nativeEvent instanceof SubmitEvent && event.nativeEvent.submitter === addAnotherButtonRef.current
    if (addAnother) {
      onNewNamedRange()
    } else {
      onDone()
    }
  }

  const namedRangeType = useMemo<NamedRangeType>(() => {
    return range === null ? NamedRangeTypes.TextOrFormula : NamedRangeTypes.Range
  }, [range])

  return (
    <form className="flex min-h-0 grow flex-col" onSubmit={form.handleSubmit(onSubmit)}>
      <div className="grow overflow-y-auto px-4">
        <div className="py-4">
          <div className="flex flex-col gap-4">
            <FormGroup>
              <FormLabel htmlFor="name">{s('Name')}</FormLabel>
              <Input
                id="name"
                required
                pattern="[^\s]+"
                title={s('Name should not contain spaces')}
                autoFocus
                {...form.register('name')}
              />
            </FormGroup>

            <FormGroup>
              <FormLabel>{s('Type')}</FormLabel>

              <Ariakit.RadioProvider
                value={namedRangeType}
                setValue={(value) => {
                  if (value === NamedRangeTypes.Range) {
                    form.setValue('range', {
                      startRowIndex: 1,
                      endRowIndex: 1,
                      startColumnIndex: 1,
                      endColumnIndex: 1,
                      sheetId,
                    } as SheetRange)
                    form.setValue('value', null)
                  } else if (value === NamedRangeTypes.TextOrFormula) {
                    form.setValue('range', null)
                    form.setValue('value', '')
                  }
                }}
              >
                <Ariakit.RadioGroup className="flex items-center gap-4">
                  <FormRadio value={NamedRangeTypes.Range}>{s('Range')}</FormRadio>
                  <FormRadio value={NamedRangeTypes.TextOrFormula}>{s('Text or formula')}</FormRadio>
                </Ariakit.RadioGroup>
              </Ariakit.RadioProvider>
            </FormGroup>

            {namedRangeType === NamedRangeTypes.Range ? (
              <FormGroup>
                <FormLabel>{s('Apply to range')}</FormLabel>
                <FormulaInput
                  onChange={(value) => {
                    const range = formulaToRange(value)
                    if (range) {
                      form.setValue('range', range as SheetRange)
                    }
                  }}
                  value={range ? rangeToAddress(range) : '='}
                  required
                  placeholder={s('Enter a formula')}
                  autoFocus
                  className="mb-0 w-full"
                />
              </FormGroup>
            ) : null}

            {namedRangeType === NamedRangeTypes.TextOrFormula ? (
              <FormGroup>
                <FormLabel>{s('Enter text or formula')}</FormLabel>
                <FormulaInput
                  onChange={(value) => form.setValue('value', value)}
                  value={String(value ?? '')}
                  required
                  autoFocus
                  className="mb-0 w-full"
                />
              </FormGroup>
            ) : null}

            <div className="mt-2 border-t-[0.5px] border-[#EAE7E4] py-2">
              <Button
                ref={addAnotherButtonRef}
                type="submit"
                className="inline-flex h-[36px] items-center gap-1.5 rounded-lg border border-[#DEDBD9] px-4 text-[13px]"
              >
                <Icon legacyName="plus" />
                {s('Add another named range')}
              </Button>
            </div>
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

type NamedRangesState = { type: 'list' } | { type: 'editNamedRange'; namedRange: NamedRange; key: string }

function NamedRanges() {
  const namedRanges = useUI((ui) => ui.legacy.namedRanges)
  const sheetId = useUI((ui) => ui.legacy.activeSheetId)
  const onDeleteNamedRange = useUI((ui) => ui.legacy.onDeleteNamedRange)
  const onCreateNamedRange = useUI((ui) => ui.legacy.onCreateNamedRange)
  const onUpdateNamedRange = useUI((ui) => ui.legacy.onUpdateNamedRange)
  const onRequestDefineNamedRange = useUI((ui) => ui.legacy.onRequestDefineNamedRange)

  const api = useSpreadsheetApi()
  const namedRange = useEditingNamedRange()
  const [previousNamedRange, setPreviousNamedRange] = useState(namedRange)
  const [state, setState] = useState<NamedRangesState>(() =>
    namedRange ? { type: 'editNamedRange', namedRange, key: GenerateUUID() } : { type: 'list' },
  )

  /* Reset NamedRangeEditor when namedRange value changes */
  if (namedRange && namedRange !== previousNamedRange) {
    setState({ type: 'editNamedRange', namedRange, key: GenerateUUID() })
    setPreviousNamedRange(namedRange)
  }

  const onNewNamedRange = useEvent(() => {
    const activeCell = api?.getActiveSheet()?.getActiveCell()
    const selections = api?.getActiveSheet()?.getSelections()
    if (activeCell && selections) {
      onRequestDefineNamedRange(sheetId, activeCell, selections)
    }
  })
  const setTypeToList = useEvent(() => setState({ type: 'list' }))
  const onSelectNamedRange = useEvent((namedRange: NamedRange) =>
    setState({ type: 'editNamedRange', namedRange, key: GenerateUUID() }),
  )

  return (
    <Fragment>
      {state.type === 'list' ? (
        <NamedRangesList
          namedRanges={namedRanges}
          sheetId={sheetId}
          onSelectNamedRange={onSelectNamedRange}
          onNewNamedRange={onNewNamedRange}
          onDeleteNamedRange={onDeleteNamedRange}
        />
      ) : null}
      {state.type === 'editNamedRange' ? (
        <NamedRangeEditor
          key={state.key}
          setNamedRangesState={setState}
          namedRange={state.namedRange}
          sheetId={sheetId}
          onCreateNamedRange={onCreateNamedRange}
          onUpdateNamedRange={onUpdateNamedRange}
          onDone={setTypeToList}
          onNewNamedRange={onNewNamedRange}
        />
      ) : null}
    </Fragment>
  )
}

export function NamedRangeEditorDialog() {
  const [open, setOpen] = useEditNamedRangeDialogState()
  return (
    <SidebarDialog open={open} setOpen={setOpen}>
      <div className="flex h-full min-h-0 flex-col">
        <SidebarDialogHeader title={s('Named Ranges')} />
        <NamedRanges />
      </div>
    </SidebarDialog>
  )
}

function strings() {
  return {
    'Delete named range': c('sheets_2025:Spreadsheet sidebar named ranges dialog').t`Delete named range`,
    'Named Ranges': c('sheets_2025:Spreadsheet sidebar named ranges dialog').t`Named Ranges`,
    Name: c('sheets_2025:Spreadsheet sidebar named ranges dialog').t`Name`,
    'Name should not contain spaces': c('sheets_2025:Spreadsheet sidebar named ranges dialog')
      .t`Name should not contain spaces`,
    Type: c('sheets_2025:Spreadsheet sidebar named ranges dialog').t`Type`,
    Range: c('sheets_2025:Spreadsheet sidebar named ranges dialog').t`Range`,
    'Text or formula': c('sheets_2025:Spreadsheet sidebar named ranges dialog').t`Text or formula`,
    'Apply to range': c('sheets_2025:Spreadsheet sidebar named ranges dialog').t`Apply to range`,
    'Enter a formula': c('sheets_2025:Spreadsheet sidebar named ranges dialog').t`Enter a formula`,
    'Enter text or formula': c('sheets_2025:Spreadsheet sidebar named ranges dialog').t`Enter text or formula`,
    'Add another named range': c('sheets_2025:Spreadsheet sidebar named ranges dialog').t`Add another named range`,
    'Add named range': c('sheets_2025:Spreadsheet sidebar named ranges dialog').t`Add named range`,
    Cancel: c('sheets_2025:Spreadsheet sidebar named ranges dialog').t`Cancel`,
    Save: c('sheets_2025:Spreadsheet sidebar named ranges dialog').t`Save`,
  }
}
