import { useSheetsMessages } from '../../SheetsDependenciesProvider'
import { clsx } from 'clsx'

interface GridFooterProps {
  sheetId: number
  onRequestAddRows: (sheetId: number, additionalRowCount: number) => void
}

export function GridFooter({ sheetId, onRequestAddRows }: GridFooterProps) {
  const messages = useSheetsMessages()

  return (
    <div className="h-full w-full self-start bg-[black]/[0.03] px-24 pt-3 text-sm">
      <form
        className="flex items-center gap-3"
        onSubmit={(event) => {
          event.preventDefault()
          const formData = new FormData(event.currentTarget)
          const value = (formData.get('count') as string) || '0'
          const count = Number.parseInt(value)
          onRequestAddRows(sheetId, count)
        }}
      >
        <button type="submit" className="h-[36px] px-2 font-semibold">
          {messages.gridFooter.Add}
        </button>

        <input
          type="number"
          name="count"
          defaultValue={1000}
          className={clsx(
            'h-[36px] w-[70px] text-ellipsis rounded-lg border border-[#ADABA8] px-3 text-center !outline-none',
            'font-semibold transition focus-visible:border-[#6D4AFF] focus-visible:ring-[3px] focus-visible:ring-[#6D4AFF33]',
          )}
        />
        <span>{messages.gridFooter['more rows at the bottom']}</span>
      </form>
    </div>
  )
}

export const gridFooterMessages = {
  gridFooter: { Add: 'Add', 'more rows at the bottom': 'more rows at the bottom' },
}
