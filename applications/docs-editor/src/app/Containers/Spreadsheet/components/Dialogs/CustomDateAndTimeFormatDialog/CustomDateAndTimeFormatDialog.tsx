import { c } from 'ttag'
import { useMemo, useRef, useState } from 'react'
import { ssfFormat } from '@rowsncolumns/utils'
import { createStringifier } from '../../../stringifier'
import { useUI } from '../../../ui-store'
import clsx from '@proton/utils/clsx'
import * as Ariakit from '@ariakit/react'
import { Button, FormGroup, FormLabel } from '../../Sidebar/shared'
import { DateAndTimeFormatEditor, type DateAndTimeFormatEditorRef } from './DateAndTimeFormatEditor'
import { hasToken, inferDateFormatType, stripUnsupportedDirectives } from './customDateAndTimeFormat'

const { s } = createStringifier(strings)

const PATTERN_PRESETS: string[] = [
  'm/d',
  'mm-dd',
  'd.m',
  'm/d/yy',
  'mm-dd-yy',
  'd/m/yyyy',
  'mm-dd-yyyy',
  'yyyy-mm-dd',
  'd-mmm',
  'mmm-d',
  'd-mmm-yyyy',
  'mmm d, yyyy',
  'mmmm d',
  'mmmm d, yyyy',
  'dddd, mmmm d, yyyy',
  'h:mm AM/PM',
  'h:mm:ss AM/PM',
  'hh:mm',
  'hh:mm:ss',
  'm/d hh:mm',
  'dddd, mmmm d, yyyy, h:mm:ss AM/PM',
  'dddd, mmmm d, yyyy "at" h:mm:ss AM/PM',
]

const SAMPLE_DATE = new Date(1930, 7, 5, 13, 25, 59)

export function CustomDateAndTimeFormatDialogContent() {
  const store = useUI((ui) => ui.view.customDateAndTimeFormatDialog.store)
  const sheetId = useUI((ui) => ui.legacy.activeSheetId)
  const selections = useUI((ui) => ui.legacy.selections)
  const activeCell = useUI((ui) => ui.legacy.activeCell)
  const onChangeFormatting = useUI((ui) => ui.legacy.onChangeFormatting)
  const currentCellFormat = useUI((ui) => ui.legacy.currentCellFormat)
  const locale = useUI((ui) => ui.locale)
  const [pattern, setPattern] = useState('')
  const formatEditorRef = useRef<DateAndTimeFormatEditorRef | null>(null)

  // Seed the editor with the active cell's existing pattern, but only when it's already a date/time format.
  const initialPattern = useMemo(() => {
    const numberFormat = currentCellFormat?.numberFormat
    if (numberFormat?.type === 'DATE' || numberFormat?.type === 'DATE_TIME') {
      return stripUnsupportedDirectives(numberFormat.pattern ?? '')
    }
    return ''
  }, [currentCellFormat])

  const patterns = useMemo(
    () =>
      PATTERN_PRESETS.map((p) => ({
        pattern: p,
        sample: ssfFormat(p, SAMPLE_DATE, locale.resolved),
      })),
    [locale.resolved],
  )

  const formattedExample = useMemo(() => {
    if (!hasToken(pattern)) {
      return ''
    }
    return ssfFormat(pattern, SAMPLE_DATE, locale.resolved)
  }, [pattern, locale.resolved])

  const canSubmit = useMemo(() => {
    return hasToken(pattern)
  }, [pattern])

  const apply = () => {
    if (!canSubmit) {
      return
    }
    onChangeFormatting?.(sheetId, activeCell, selections, {
      numberFormat: { type: inferDateFormatType(pattern), pattern },
    })
    store.hide()
  }

  return (
    <div className="flex flex-col">
      <div className="mb-6">
        <Ariakit.DialogHeading className="text-lg font-bold">{s('Custom date and time formats')}</Ariakit.DialogHeading>
      </div>

      <div className="mb-6 shrink-0">
        <FormGroup>
          <FormLabel>{s('Format')}</FormLabel>
          <DateAndTimeFormatEditor ref={formatEditorRef} initialPattern={initialPattern} onPatternChange={setPattern} />
        </FormGroup>

        <div className="mt-3 text-sm">
          <span className="text-[#707070]">{s('Sample')}:</span> <span>{formattedExample}</span>
        </div>
      </div>

      <div className="flex h-80 min-h-0 flex-col overflow-y-auto rounded-lg border border-[#EAE7E4]">
        <div className="flex min-w-0 flex-col empty:hidden">
          {patterns.map((p) => {
            return (
              <button
                key={p.pattern}
                type="button"
                onClick={() => formatEditorRef.current?.setPattern(p.pattern)}
                onMouseDown={(event) => event.preventDefault()}
                className="flex h-10 min-w-0 shrink-0 items-center justify-between gap-2 px-4 text-left last:!border-0 hover:bg-[#C2C1C033]"
                style={{ borderBottom: '0.5px solid #EAE7E4' }}
              >
                <span className="truncate text-sm">{p.sample}</span>
              </button>
            )
          })}
        </div>
      </div>

      <div className="mt-4 flex shrink-0 items-center justify-between gap-2">
        <Button
          onClick={store.hide}
          type="button"
          className="inline-flex h-[36px] items-center gap-1.5 rounded-lg border border-[#DEDBD9] px-4 text-[13px]"
        >
          {s('Cancel')}
        </Button>
        <Button
          type="button"
          disabled={!canSubmit}
          className="inline-flex h-[36px] items-center gap-1.5 rounded-lg bg-[#6D4AFF] px-4 text-[13px] text-[white] aria-disabled:opacity-50"
          onClick={apply}
        >
          {s('Apply')}
        </Button>
      </div>
    </div>
  )
}

export function CustomDateAndTimeFormatDialog() {
  const store = useUI((ui) => ui.view.customDateAndTimeFormatDialog.store)

  return (
    <Ariakit.DialogProvider store={store}>
      <Ariakit.Dialog
        portal={false}
        backdrop={false}
        modal={false}
        unmountOnHide
        className={clsx(
          'fixed inset-4 z-10 m-auto h-fit w-full max-w-[32rem] bg-[white]',
          'rounded-xl p-6',
          'border border-[#D1CFCD] shadow-[0px_8px_24px_0px_rgba(0,0,0,0.16)] outline-none',
        )}
      >
        <CustomDateAndTimeFormatDialogContent />
      </Ariakit.Dialog>
    </Ariakit.DialogProvider>
  )
}

function strings() {
  return {
    'Custom date and time formats': c('sheets_2025:Spreadsheet custom date and time formats dialog')
      .t`Custom date and time formats`,
    Format: c('sheets_2025:Spreadsheet custom date and time formats dialog').t`Format`,
    Cancel: c('sheets_2025:Spreadsheet custom date and time formats dialog').t`Cancel`,
    Apply: c('sheets_2025:Spreadsheet custom date and time formats dialog').t`Apply`,
    Sample: c('sheets_2025:Spreadsheet custom date and time formats dialog').t`Sample`,
  }
}
