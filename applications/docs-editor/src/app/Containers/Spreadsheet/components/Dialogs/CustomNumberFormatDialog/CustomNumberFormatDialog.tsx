import { c } from 'ttag'
import { useMemo, useState } from 'react'
import { ssfFormat, ssfFormatColor } from '@rowsncolumns/utils'
import { createStringifier } from '../../../stringifier'
import { useUI } from '../../../ui-store'
import clsx from '@proton/utils/clsx'
import * as Ariakit from '@ariakit/react'
import { Button, FormGroup, FormLabel, Input } from '../../Sidebar/shared'
import {
  getPatternParts,
  getPatterns,
  inferNumberFormatType,
  type PatternPartLabel,
  type SchemaNumberFormatType,
} from './customNumberFormat'

const SAMPLE_VALUE = 1234.56

const SAMPLE_VALUES_BY_LABEL: Record<PatternPartLabel, number | string> = {
  sample: SAMPLE_VALUE,
  positive: SAMPLE_VALUE,
  negative: -SAMPLE_VALUE,
  zero: 0,
  text: 'text',
}

const LABEL_STRING_KEY = {
  sample: 'Sample',
  positive: 'Positive',
  negative: 'Negative',
  zero: 'Zero',
  text: 'Text',
} as const satisfies Record<PatternPartLabel, string>

const { s } = createStringifier(strings)

export function CustomNumberFormatDialog() {
  const store = useUI((ui) => ui.view.customNumberFormatDialog.store)
  const sheetId = useUI((ui) => ui.legacy.activeSheetId)
  const selections = useUI((ui) => ui.legacy.selections)
  const activeCell = useUI((ui) => ui.legacy.activeCell)
  const onChangeFormatting = useUI((ui) => ui.legacy.onChangeFormatting)
  const locale = useUI((ui) => ui.locale)
  const [pattern, setPattern] = useState('')
  const [searchTerm, setSearchTerm] = useState('')

  const patterns = useMemo(
    () =>
      getPatterns().map((p) => ({
        ...p,
        sample: ssfFormat(p.pattern, SAMPLE_VALUE, locale.resolved),
        sampleColor: ssfFormatColor(p.pattern, SAMPLE_VALUE),
      })),
    [locale.resolved],
  )

  const presetTypeMap = useMemo(() => {
    const map = new Map<string, SchemaNumberFormatType>()
    for (const p of patterns) {
      map.set(p.pattern, p.type)
    }
    return map
  }, [patterns])

  const filteredPatterns = useMemo(() => {
    const query = searchTerm.toLowerCase()
    if (!query) {
      return patterns
    }
    return patterns.filter((p) => p.pattern.toLowerCase().includes(query))
  }, [patterns, searchTerm])

  const parts = useMemo(
    () =>
      getPatternParts(pattern).map((part) => ({
        ...part,
        color: ssfFormatColor(pattern, SAMPLE_VALUES_BY_LABEL[part.label]),
      })),
    [pattern],
  )

  const canSubmit = pattern.trim() !== ''

  const apply = () => {
    if (!canSubmit) {
      return
    }
    const type = presetTypeMap.get(pattern) ?? inferNumberFormatType(pattern)
    onChangeFormatting?.(sheetId, activeCell, selections, {
      numberFormat: { type, pattern },
    })
    store.hide()
  }

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
        <div className="flex flex-col">
          <div className="mb-6">
            <Ariakit.DialogHeading className="text-lg font-bold">{s('Custom number formats')}</Ariakit.DialogHeading>
          </div>

          <div className="mb-4 shrink-0">
            <FormGroup>
              <FormLabel>{s('Format')}</FormLabel>
              <Input
                placeholder={s('Custom number format')}
                value={pattern}
                onChange={(event) => {
                  const value = event.target.value
                  setPattern(value)
                  setSearchTerm(value)
                }}
              />
            </FormGroup>
          </div>

          {pattern !== '' ? (
            <div className="mb-4 grid grid-cols-2 gap-y-1">
              {parts.map((part) => (
                <div key={part.label} className="text-sm">
                  <span className="text-[#707070]">{s(LABEL_STRING_KEY[part.label])}:</span>{' '}
                  <span style={part.color ? { color: part.color } : undefined}>
                    {ssfFormat(pattern, SAMPLE_VALUES_BY_LABEL[part.label], locale.resolved)}
                  </span>
                </div>
              ))}
            </div>
          ) : null}

          <div className="flex h-80 min-h-0 flex-col overflow-y-auto rounded-lg border border-[#EAE7E4]">
            <div className="flex min-w-0 flex-col empty:hidden">
              {filteredPatterns.map((p) => {
                const isActive = p.pattern === pattern

                return (
                  <button
                    key={p.pattern}
                    className={clsx(
                      'flex h-10 min-w-0 shrink-0 items-center justify-between gap-2 px-4 text-left last:!border-0',
                      isActive && 'bg-[#C2C1C033]',
                    )}
                    style={{ borderBottom: '0.5px solid #EAE7E4' }}
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => setPattern(p.pattern)}
                  >
                    <span className="truncate text-sm">{p.pattern}</span>
                    <span
                      className="shrink-0 text-xs font-semibold"
                      style={p.sampleColor ? { color: p.sampleColor } : undefined}
                    >
                      {p.sample}
                    </span>
                  </button>
                )
              })}
            </div>

            {filteredPatterns.length === 0 ? (
              <div className="flex flex-1 items-center justify-center">
                <span className="text-center text-sm text-[#949494]">
                  {s('Apply to create a custom number format')}
                </span>
              </div>
            ) : null}
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
      </Ariakit.Dialog>
    </Ariakit.DialogProvider>
  )
}

function strings() {
  return {
    'Custom number formats': c('sheets_2025:Spreadsheet sidebar custom number format dialog').t`Custom number formats`,
    'Custom number format': c('sheets_2025:Spreadsheet sidebar custom number format dialog').t`Custom number format`,
    'Apply to create a custom number format': c('sheets_2025:Spreadsheet sidebar custom number format dialog')
      .t`Apply to create a custom number format`,
    Format: c('sheets_2025:Spreadsheet sidebar custom number format dialog').t`Format`,
    Cancel: c('sheets_2025:Spreadsheet sidebar custom number format dialog').t`Cancel`,
    Apply: c('sheets_2025:Spreadsheet sidebar custom number format dialog').t`Apply`,
    Sample: c('sheets_2025:Spreadsheet sidebar custom number format dialog').t`Sample`,
    Positive: c('sheets_2025:Spreadsheet sidebar custom number format dialog').t`Positive`,
    Negative: c('sheets_2025:Spreadsheet sidebar custom number format dialog').t`Negative`,
    Zero: c('sheets_2025:Spreadsheet sidebar custom number format dialog').t`Zero`,
    Text: c('sheets_2025:Spreadsheet sidebar custom number format dialog').t`Text`,
  }
}
