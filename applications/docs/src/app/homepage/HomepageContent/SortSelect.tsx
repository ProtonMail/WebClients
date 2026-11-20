import * as Ariakit from '@ariakit/react'
import { IcArrowDownArrowUp } from '@proton/icons/icons/IcArrowDownArrowUp'
import { IcCheckmark } from '@proton/icons/icons/IcCheckmark'
import { type KeyboardEvent, useRef, useState } from 'react'
import { IconButton } from '../components/ui'
import { useHomepageView, type RecentsSort } from '../homepageViewContext'
import { useHomepageMessages } from '../messages/HomepageMessagesProvider'
import { TelemetryEvent } from '../utils/telemetry'
import { DropdownMenu, DropdownMenuItem } from './menu'

// TODO: add 'modified' once "last modified" is supported.
const SORT_SELECT_OPTIONS = ['viewed', 'name', 'owner', 'location'] satisfies RecentsSort[]

const TELEMETRY_EVENT_BY_SORT: Record<RecentsSort, TelemetryEvent> = {
  viewed: TelemetryEvent.sorting_changed_to_time,
  //   modified: TelemetryEvent.sorting_changed_to_modified,
  name: TelemetryEvent.sorting_changed_to_name,
  owner: TelemetryEvent.sorting_changed_to_owner,
  location: TelemetryEvent.sorting_changed_to_location,
}

export function SortSelect() {
  const { state, setRecentsSort, reportTelemetry } = useHomepageView()
  const sortValue = state.view === 'recents' ? state.sort : undefined
  const menuRef = useRef<HTMLDivElement>(null)
  const [openedByArrow, setOpenedByArrow] = useState(false)
  // Where Proton's dropdown ended up, with the button at the table's right edge.
  const menu = Ariakit.useMenuStore({ placement: 'bottom-end', focusLoop: true })
  const messages = useHomepageMessages().sort

  return (
    <Ariakit.MenuProvider store={menu}>
      <Ariakit.MenuButton
        onKeyDown={(event: KeyboardEvent) => setOpenedByArrow(event.key === 'ArrowDown' || event.key === 'ArrowUp')}
        onClick={() => setOpenedByArrow(false)}
        render={
          <IconButton
            label={messages.sortBy}
            aria-label={messages.changeSortOrder}
            shape="ghost"
            className="ml-auto shrink-0 px-2 aria-expanded:bg-[--interaction-default-active]"
          />
        }
      >
        <IcArrowDownArrowUp className="shrink-0" />
      </Ariakit.MenuButton>
      <DropdownMenu
        ref={menuRef}
        // Proton's dropdown takes focus itself on click and Enter; the arrows still open on an option. Spread,
        // because an `initialFocus={undefined}` would replace Ariakit's choice of option.
        {...(openedByArrow ? {} : { initialFocus: menuRef })}
        gutter={8}
      >
        <p className="m-0 px-4 py-2 text-[.875rem] font-bold">{messages.sortBy}</p>
        {SORT_SELECT_OPTIONS.map((value) => (
          <DropdownMenuItem
            key={value}
            onClick={() => {
              setRecentsSort(value)
              reportTelemetry(TELEMETRY_EVENT_BY_SORT[value])
            }}
          >
            <span>{messages.options[value]}</span>
            {sortValue === value ? <IcCheckmark /> : null}
          </DropdownMenuItem>
        ))}
      </DropdownMenu>
    </Ariakit.MenuProvider>
  )
}
