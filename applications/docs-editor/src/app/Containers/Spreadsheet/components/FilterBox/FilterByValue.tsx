import { BLANK_LABEL, DEFAULT_ARRAY } from '@rowsncolumns/spreadsheet'
import { useSheetsMessages } from '../../SheetsDependenciesProvider'
import * as Icons from '../icons'
import { useMemo, useRef, useState } from 'react'
import * as Ariakit from '@ariakit/react'
import { Button, FormGroup, FormLabel, Input } from '../Sidebar/shared'
import * as UI from '../ui'
import { useVirtualizer } from '@tanstack/react-virtual'
import { escapeCharacters } from '@rowsncolumns/utils'

type FilterByValueProps = {
  values?: string[]
  visibleValues?: string[] | undefined | null
  onChangeVisibleValues: React.Dispatch<React.SetStateAction<string[] | undefined | null>>
}

export function FilterByValue({ visibleValues, values = DEFAULT_ARRAY, onChangeVisibleValues }: FilterByValueProps) {
  const messages = useSheetsMessages()

  const [query, setQuery] = useState('')
  const parentRef = useRef<HTMLDivElement | null>(null)

  const filteredValues = useMemo(() => {
    const regex = new RegExp(escapeCharacters(query), 'gi')
    return values.filter((value) => {
      return regex.test(String(value))
    })
  }, [values, query])

  const rowVirtualizer = useVirtualizer({
    count: filteredValues.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 36,
    overscan: 5,
    measureElement: (element) => element?.getBoundingClientRect().height,
  })

  const onCheck = (value: string) => {
    onChangeVisibleValues((prev = []) => {
      const newVisibleValues = prev?.concat(value)
      if (newVisibleValues?.length === values.length) {
        return undefined
      }
      return newVisibleValues
    })
  }

  const onUnCheck = (value: string) => {
    onChangeVisibleValues((prev = values) => prev?.filter((cur) => cur !== value))
  }

  return (
    <FormGroup>
      <FormLabel>{messages.filterByValue['Filter by value']}</FormLabel>

      <div className="flex items-center gap-2 text-xs text-[--link-norm] *:py-1">
        <Button onClick={() => onChangeVisibleValues(undefined)}>{messages.filterByValue['Select all']}</Button>
        <Button onClick={() => onChangeVisibleValues([])}>{messages.filterByValue.Clear}</Button>
      </div>

      <div className="relative isolate flex flex-col">
        <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
          <UI.Icon data={Icons.magnifier} />
        </span>
        <Input value={query} onChange={(e) => setQuery(e.target.value)} className="pl-8" />
      </div>

      <div ref={parentRef} className="max-h-44 overflow-y-auto">
        <div
          style={{
            height: `${rowVirtualizer.getTotalSize()}px`,
            width: '100%',
            position: 'relative',
          }}
        >
          {rowVirtualizer.getVirtualItems().map((virtualItem) => {
            const value = filteredValues[virtualItem.index]
            const isVisible = visibleValues ? visibleValues.indexOf(value) !== -1 : true

            return (
              <Ariakit.CheckboxProvider key={virtualItem.key}>
                <Ariakit.Checkbox
                  ref={rowVirtualizer.measureElement}
                  data-index={virtualItem.index}
                  render={<Button />}
                  checked={isVisible}
                  onClick={() => {
                    if (isVisible) {
                      onUnCheck(value)
                    } else {
                      onCheck(value)
                    }
                  }}
                  value={value}
                  className="group flex gap-2 py-1.5 text-start text-sm"
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    transform: `translateY(${virtualItem.start}px)`,
                  }}
                >
                  <span className="mt-0 shrink-0 opacity-0 group-aria-checked:opacity-100">
                    <UI.Icon data={Icons.checkmark} />
                  </span>
                  <span className="line-clamp-3">
                    {value === BLANK_LABEL ? messages.contextMenu['(Blanks)'] : value}
                  </span>
                </Ariakit.Checkbox>
              </Ariakit.CheckboxProvider>
            )
          })}
        </div>
      </div>
    </FormGroup>
  )
}

export const filterByValueMessages = {
  filterByValue: {
    'Filter by value': `Filter by value`,
    'Select all': `Select all`,
    Clear: `Clear`,
  },
}
