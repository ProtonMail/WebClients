import * as Ariakit from '@ariakit/react'
import { c } from 'ttag'
import { useUI } from '../../ui-store'
import { Icon } from '../ui'
import { createStringifier } from '../../stringifier'

export type SheetSearchProps = {
  isActive?: boolean
  searchQuery?: string
  onSubmit(query: string): void
  onReset(): void
  onNext(): void
  onPrevious(): void
  disablePrevious?: boolean
  disableNext?: boolean
  totalResults?: number
  currentResult?: number
}

const { s } = createStringifier(strings)

export function SheetSearch({
  onSubmit,
  onReset,
  onNext,
  onPrevious,
  searchQuery,
  isActive,
  totalResults = 0,
  currentResult = 0,
}: SheetSearchProps) {
  const handleReset = useUI.$.withFocusGrid(onReset)
  const navigationDisabled = totalResults < 2

  return (
    <Ariakit.Dialog
      modal={false}
      hideOnInteractOutside={false}
      unmountOnHide
      hideOnEscape={false}
      open={isActive}
      onClose={handleReset}
      className="absolute right-4 top-4 flex w-[400px] items-center gap-2 rounded-b-[8px] border border-[#D1CFCD] bg-[white] px-2.5 py-2.5 shadow-[0px_12px_24px_-4px_rgba(0,0,0,0.16)] outline-none"
    >
      <label className="flex h-[34px] min-w-0 grow cursor-text items-center gap-1.5 rounded-[8px] border border-[#D1CFCD] pl-3 pr-4 transition focus-within:border-[#6D4AFF] focus-within:ring-[3px] focus-within:ring-[#6D4AFF]/20">
        <Icon legacyName="magnifier" />
        <input
          className="grow truncate text-[14px] !outline-none"
          placeholder={c('sheets_2025:Spreadsheet editor').t`Find in sheet`}
          autoFocus
          onChange={(event) => onSubmit(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Escape') {
              handleReset()
            }
            if (event.key === 'Enter') {
              onNext()
            }
          }}
        />

        {searchQuery || totalResults > 0 ? (
          <span className="pointer-events-none shrink-0 select-none text-[14px] text-[#8F8D8A]">
            {currentResult} of {totalResults}
          </span>
        ) : null}
      </label>

      <div className="flex shrink-0 items-center">
        <button
          className="flex size-[36px] items-center justify-center disabled:opacity-50"
          onClick={onPrevious}
          disabled={navigationDisabled}
          aria-label={s('Go to previous')}
        >
          <Icon legacyName="chevron-up" />
        </button>

        <button
          className="flex size-[36px] items-center justify-center disabled:opacity-50"
          onClick={onNext}
          disabled={navigationDisabled}
          aria-label={s('Go to next')}
        >
          <Icon legacyName="chevron-down" />
        </button>

        <div className="mx-2 h-[28px] w-px shrink-0 bg-[#D1CFCD]" />

        <button className="flex size-[36px] items-center justify-center" onClick={handleReset} aria-label={s('Close')}>
          <Icon legacyName="cross" />
        </button>
      </div>
    </Ariakit.Dialog>
  )
}

function strings() {
  return {
    'Go to next': c('sheets_2025:Spreadsheet editor search dialog').t`Go to next`,
    'Go to previous': c('sheets_2025:Spreadsheet editor search dialog').t`Go to previous`,
    Close: c('sheets_2025:Spreadsheet editor search dialog').t`Close`,
  }
}
