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
import { FormGroup, FormLabel, FormRadio } from './shared'
import { Icon } from '../ui'
import { Fragment, useMemo, useRef, useState } from 'react'
import { c } from 'ttag'
import { useForm, type SubmitHandler } from 'react-hook-form'
import { createStringifier } from '../../stringifier'
import { GenerateUUID } from '@proton/docs-shared'

const { s } = createStringifier(strings)

type NamedRangeEditorDialogProps = {
  sheetId: number
  onUpdateNamedRange: ReturnType<typeof useSpreadsheetState>['onUpdateNamedRange']
  onCreateNamedRange: ReturnType<typeof useSpreadsheetState>['onCreateNamedRange']
  onRequestDefineNamedRange: ReturnType<typeof useSpreadsheetState>['onRequestDefineNamedRange']
  onDeleteNamedRange: (id: NamedRange['namedRangeId']) => void
  idCreationStrategy?: UseSpreadsheetProps['idCreationStrategy']
  namedRanges: NamedRange[]
}

interface NamedRangeListItemProps {
  namedRange: NamedRange
  sheetId: number
  onDeleteNamedRange: (id: NamedRange['namedRangeId']) => void
  onSelect: () => void
}

function NamedRangeListItem({ namedRange, sheetId, onDeleteNamedRange, onSelect }: NamedRangeListItemProps) {
  const { rangeToAddress } = useFormulaRangeHelpers({ sheetId })

  return (
    <Ariakit.Button render={<div />} onClick={onSelect} className="px-4 hover:bg-[#C2C1C033]/20">
      <div className="flex items-center border-b-[0.5px] border-[#EAE7E4] py-3">
        <div className="flex min-w-0 grow flex-col">
          <p className="text-sm font-semibold">{namedRange.name}</p>
          {namedRange.range ? <span className="text-sm">{rangeToAddress(namedRange.range)}</span> : null}
        </div>

        <button
          type="button"
          className="flex size-[36px] shrink-0 items-center justify-center"
          aria-label={s('Delete named range')}
          onClick={(event) => {
            event.stopPropagation()
            onDeleteNamedRange(namedRange.namedRangeId)
          }}
        >
          <Icon legacyName="trash" />
        </button>
      </div>
    </Ariakit.Button>
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
        <button
          type="button"
          className="inline-flex h-[36px] items-center gap-1.5 rounded-lg border border-[#DEDBD9] px-4 text-[13px]"
          onClick={onNewNamedRange}
        >
          <Icon legacyName="plus" />
          {namedRanges.length > 0 ? 'Add another named range' : 'Add named range'}
        </button>
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
  onUpdateNamedRange: NamedRangeEditorDialogProps['onUpdateNamedRange']
  setNamedRangesState: React.Dispatch<React.SetStateAction<NamedRangesState>>
  onCreateNamedRange: NamedRangeEditorDialogProps['onCreateNamedRange']
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
              <FormLabel htmlFor="name">Name</FormLabel>
              <label className="flex h-[36px] grow items-center gap-0.5 rounded-lg border border-[#ADABA8] px-3">
                <input
                  id="name"
                  required
                  pattern="[^\s]+"
                  title="Name should not contain spaces"
                  autoFocus
                  className="h-full grow truncate text-sm !outline-none"
                  {...form.register('name')}
                />
              </label>
            </FormGroup>

            <FormGroup>
              <FormLabel>Type</FormLabel>

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
                  <FormRadio value={NamedRangeTypes.Range}>Range</FormRadio>
                  <FormRadio value={NamedRangeTypes.TextOrFormula}>Text or formula</FormRadio>
                </Ariakit.RadioGroup>
              </Ariakit.RadioProvider>
            </FormGroup>

            {namedRangeType === NamedRangeTypes.Range ? (
              <FormGroup>
                <FormLabel>Apply to range</FormLabel>
                <FormulaInput
                  onChange={(value) => {
                    const range = formulaToRange(value)
                    if (range) {
                      form.setValue('range', range as SheetRange)
                    }
                  }}
                  value={range ? rangeToAddress(range) : '='}
                  required
                  placeholder="Enter a formula"
                  autoFocus
                  className="mb-0 w-full"
                />
              </FormGroup>
            ) : null}

            {namedRangeType === NamedRangeTypes.TextOrFormula ? (
              <FormGroup>
                <FormLabel>Enter text or formula</FormLabel>
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
              <button
                ref={addAnotherButtonRef}
                type="submit"
                className="inline-flex h-[36px] items-center gap-1.5 rounded-lg border border-[#DEDBD9] px-4 text-[13px]"
              >
                <Icon legacyName="plus" />
                Add another named range
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-auto flex shrink-0 items-center justify-end gap-2 border-t-[0.5px] border-[#EAE7E4] py-2">
        <button
          type="button"
          className="inline-flex h-[36px] items-center gap-1.5 rounded-lg border border-[#DEDBD9] px-4 text-[13px]"
          onClick={onDone}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="inline-flex h-[36px] items-center gap-1.5 rounded-lg bg-[#6D4AFF] px-4 text-[13px] text-[white]"
        >
          Save
        </button>
      </div>
    </form>
  )
}

type NamedRangesState = { type: 'list' } | { type: 'editNamedRange'; namedRange: NamedRange; key: string }

function NamedRanges({
  namedRanges,
  sheetId,
  onDeleteNamedRange,
  onCreateNamedRange,
  onUpdateNamedRange,
  idCreationStrategy,
  onRequestDefineNamedRange,
}: NamedRangeEditorDialogProps) {
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

  const onNewNamedRange = () => {
    const activeCell = api?.getActiveSheet()?.getActiveCell()
    const selections = api?.getActiveSheet()?.getSelections()
    if (activeCell && selections) {
      onRequestDefineNamedRange(sheetId, activeCell, selections)
    }
  }

  return (
    <Fragment>
      {state.type === 'list' ? (
        <NamedRangesList
          namedRanges={namedRanges}
          sheetId={sheetId}
          onSelectNamedRange={(namedRange) => {
            setState({ type: 'editNamedRange', namedRange, key: GenerateUUID() })
          }}
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
          onDone={() => setState({ type: 'list' })}
          onNewNamedRange={onNewNamedRange}
          idCreationStrategy={idCreationStrategy}
        />
      ) : null}
    </Fragment>
  )
}

export function NamedRangeEditorDialog(props: NamedRangeEditorDialogProps) {
  const [open, setOpen] = useEditNamedRangeDialogState()
  return (
    <SidebarDialog open={open} setOpen={setOpen}>
      <div className="flex h-full min-h-0 flex-col">
        <SidebarDialogHeader title="Named Ranges" />
        <NamedRanges {...props} />
      </div>
    </SidebarDialog>
  )
}

function strings() {
  return {
    'Delete named range': c('sheets_2025:Spreadsheet sidebar named ranges dialog delete range').t`Delete named range`,
  }
}
