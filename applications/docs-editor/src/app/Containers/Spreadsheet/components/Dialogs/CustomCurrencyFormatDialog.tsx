import { c } from 'ttag'
import { createStringifier } from '../../stringifier'
import { useLayoutEffect, useMemo, useState } from 'react'
import { getCurrencyList } from '../../locale'
import { useUI } from '../../ui-store'
import clsx from '@proton/utils/clsx'
import { Button, FormGroup, FormLabel, Input, Select, SelectItem, SelectPopover } from '../Sidebar/shared'
import * as Ariakit from '@ariakit/react'
import { ssfFormat } from '@rowsncolumns/utils'

const { s } = createStringifier(strings)

function getCurrencyVariations(locale: string, symbol: string, currencyCode?: string) {
  // 1. Define the raw patterns
  const variations = [
    {
      // Standard (Prefix) -> "BTC 1,000.00"
      pattern: `"${symbol}"#,##0.00`,
    },
    {
      // Explicit (Code + Symbol) -> SKIPPED for custom text
      // e.g. "USD $" is useful, but "BTC BTC" is redundant
      pattern: `"${currencyCode} ${symbol}"#,##0.00`,
      skip: !currencyCode || currencyCode === symbol,
    },
    {
      // Rounded (Prefix) -> "BTC 1,000"
      pattern: `"${symbol}"#,##0`,
    },
    {
      // Suffix (Standard) -> "1,000.00 Credits"
      pattern: `#,##0.00"${symbol}"`,
    },
    {
      // Suffix (Rounded) -> "1,000 Credits"
      pattern: `#,##0"${symbol}"`,
    },
  ]

  const labeled = variations
    .filter((v) => !v.skip)
    .map((v) => ({
      label: ssfFormat(v.pattern, 1000, locale),
      pattern: v.pattern,
    }))

  // 2. DEDUPLICATE: Remove items with identical labels
  // This keeps the first occurrence and drops the duplicates
  const uniqueVariations = []
  const seenLabels = new Set()

  for (const item of labeled) {
    if (!seenLabels.has(item.label)) {
      seenLabels.add(item.label)
      uniqueVariations.push(item)
    }
  }

  return uniqueVariations
}

export function CustomCurrencyFormatDialog() {
  const store = useUI((ui) => ui.view.customCurrencyFormatDialog.store)
  const sheetId = useUI((ui) => ui.legacy.activeSheetId)
  const selections = useUI((ui) => ui.legacy.selections)
  const activeCell = useUI((ui) => ui.legacy.activeCell)
  const onChangeFormatting = useUI((ui) => ui.legacy.onChangeFormatting)
  const locale = useUI((ui) => ui.locale)
  const currencyList = useMemo(() => getCurrencyList(locale.resolved), [locale.resolved])
  const [currencySymbol, setCurrencySymbol] = useState('$')
  const [currencyCode, setCurrencyCode] = useState<string | undefined>()
  const [searchTerm, setSearchTerm] = useState('')
  const selectStore = Ariakit.useSelectStore()
  const selectValue = Ariakit.useStoreState(selectStore, (s) => s.value)
  const canSubmit = Boolean(selectValue) && currencySymbol.trim() !== ''

  const filteredCurrencyList = useMemo(() => {
    if (!searchTerm) {
      return currencyList
    }

    const processedSearchTerm = searchTerm.toLowerCase()
    return currencyList.filter(
      (c) => c.name.toLowerCase().includes(processedSearchTerm) || c.code.toLowerCase().includes(processedSearchTerm),
    )
  }, [currencyList, searchTerm])

  const currencyVariations = useMemo(
    () => getCurrencyVariations(locale.resolved, currencySymbol, currencyCode),
    [locale.resolved, currencySymbol, currencyCode],
  )

  useLayoutEffect(
    function focusFirstItemWhenVariationsChange() {
      selectStore.setValue(currencyVariations[0]?.pattern || '')
    },
    [selectStore, currencyVariations],
  )

  const apply = () => {
    const pattern = selectStore.getState().value
    if (typeof pattern === 'string') {
      onChangeFormatting?.(sheetId, activeCell, selections, { numberFormat: { type: 'CURRENCY', pattern } })
      store.hide()
    }
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
            <Ariakit.DialogHeading className="text-lg font-bold">{s('Custom currenices')}</Ariakit.DialogHeading>
          </div>

          <div className="mb-4 grid shrink-0 grid-cols-2 items-center gap-2">
            <FormGroup>
              <FormLabel>Symbol</FormLabel>
              <Input
                placeholder={s('Currency symbol')}
                value={currencySymbol}
                onChange={(event) => {
                  const value = event.target.value
                  setCurrencySymbol(value)
                  setCurrencyCode(undefined)
                  setSearchTerm(value)
                }}
              />
            </FormGroup>

            <FormGroup>
              <FormLabel>Format</FormLabel>
              <Ariakit.SelectProvider store={selectStore}>
                <Select />
                <SelectPopover sameWidth>
                  <Ariakit.SelectGroup className="py-2">
                    {currencyVariations.map((variation, index) => (
                      <SelectItem key={variation.pattern} value={variation.pattern} id={variation.pattern}>
                        {variation.label}
                      </SelectItem>
                    ))}
                  </Ariakit.SelectGroup>
                </SelectPopover>
              </Ariakit.SelectProvider>
            </FormGroup>
          </div>

          <div className="h-80 min-h-0 overflow-y-auto rounded-lg border border-[#EAE7E4]">
            <div className="flex min-w-0 flex-col empty:hidden">
              {filteredCurrencyList.map((c) => {
                const isActive = c.code === currencyCode

                return (
                  <button
                    key={c.code}
                    className={clsx(
                      'flex h-10 min-w-0 shrink-0 items-center justify-between gap-2 px-4 text-left last:!border-0',
                      isActive && 'bg-[#C2C1C033]',
                    )}
                    style={{ borderBottom: '0.5px solid #EAE7E4' }}
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => {
                      setCurrencySymbol(c.symbol)
                      setCurrencyCode(c.code)
                    }}
                  >
                    <span className="truncate text-sm">{c.name}</span>
                    <span className="shrink-0 text-xs font-semibold">{c.example}</span>
                  </button>
                )
              })}
            </div>

            {filteredCurrencyList.length === 0 ? (
              <div className="flex h-full grow items-center justify-center">
                <span className="text-center text-sm text-[#949494]">{s('Apply to create a custom currency')}</span>
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
    'Custom currenices': c('sheets_2025:Spreadsheet sidebar custom currency format dialog').t`Custom currenices`,
    'Currency symbol': c('sheets_2025:Spreadsheet sidebar custom currency format dialog').t`Currency symbol`,
    Cancel: c('sheets_2025:Spreadsheet sidebar custom currency format dialog').t`Cancel`,
    Apply: c('sheets_2025:Spreadsheet sidebar custom currency format dialog').t`Apply`,
    'Apply to create a custom currency': c('sheets_2025:Spreadsheet sidebar custom currency format dialog')
      .t`Apply to create a custom currency`,
  }
}
