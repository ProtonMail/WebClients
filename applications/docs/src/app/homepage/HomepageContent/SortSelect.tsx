import * as Ariakit from '@ariakit/react'
import { IcArrowDownArrowUp } from '@proton/icons/icons/IcArrowDownArrowUp'
import { IcCheckmark } from '@proton/icons/icons/IcCheckmark'
import { type KeyboardEvent, useRef, useState } from 'react'
import { c } from 'ttag'
import { IconButton } from '../components/ui'
import { useHomepageView, type RecentsSort } from '../homepageViewContext'
import { TelemetryEvent } from '../utils/telemetry'
import { clsx } from '../utils/clsx'
import { Menu } from './menu'

const SORT_SELECT_OPTIONS = [
  { value: 'viewed', label: () => c('Sort menu options').t`Last viewed first` },
  // TODO: re-enable once "last modified" is supported.
  // { value: 'modified', label: () => c('Actions').t`Last modified first` },
  { value: 'name', label: () => c('Sort menu options').t`Name` },
  { value: 'owner', label: () => c('Sort menu options').t`Created by` },
  { value: 'location', label: () => c('Sort menu options').t`Location` },
] satisfies { value: RecentsSort; label: () => string }[]

const TELEMETRY_EVENT_BY_SORT: Record<RecentsSort, TelemetryEvent> = {
  viewed: TelemetryEvent.sorting_changed_to_time,
  //   modified: TelemetryEvent.sorting_changed_to_modified,
  name: TelemetryEvent.sorting_changed_to_name,
  owner: TelemetryEvent.sorting_changed_to_owner,
  location: TelemetryEvent.sorting_changed_to_location,
}

// Proton's `transform-origins` mixin (packages/styles/scss/lib/_transform-origins.scss): the dropdown scales from
// the corner or side next to its anchor.
const DROPDOWN_ORIGIN_BY_PLACEMENT: Record<Ariakit.MenuStoreState['currentPlacement'], string> = {
  top: 'bottom center',
  'top-start': 'bottom left',
  'top-end': 'bottom right',
  bottom: 'top center',
  'bottom-start': 'top left',
  'bottom-end': 'top right',
  left: 'right center',
  'left-start': 'right top',
  'left-end': 'right bottom',
  right: 'left center',
  'right-start': 'left top',
  'right-end': 'left bottom',
}

export function SortSelect() {
  const { state, setRecentsSort, reportTelemetry } = useHomepageView()
  const sortValue = state.view === 'recents' ? state.sort : undefined
  const menuRef = useRef<HTMLDivElement>(null)
  const [openedByArrow, setOpenedByArrow] = useState(false)
  // Where Proton's dropdown ended up, with the button at the table's right edge.
  const menu = Ariakit.useMenuStore({ placement: 'bottom-end', focusLoop: true })
  const placement = Ariakit.useStoreState(menu, 'currentPlacement')

  // The keys of Proton's dropdown, whose hotkeys read Cmd as Ctrl off macOS.
  const onMenuKeyDownCapture = (event: KeyboardEvent<HTMLDivElement>) => {
    const isArrow = event.key === 'ArrowUp' || event.key === 'ArrowDown'
    if (isArrow && (event.metaKey || event.ctrlKey || event.altKey || event.shiftKey)) {
      event.preventDefault()
      const jumpsToEnd = isMac() ? event.metaKey && !event.ctrlKey : event.ctrlKey && !event.metaKey
      if (jumpsToEnd && !event.altKey && !event.shiftKey) {
        menu.move(event.key === 'ArrowUp' ? menu.first() : menu.last())
      }
    } else if (event.key === 'Tab') {
      event.preventDefault()
      const isMenuFocused = event.target === event.currentTarget
      if (event.shiftKey) {
        menu.move(isMenuFocused ? menu.last() : menu.previous())
      } else {
        menu.move(isMenuFocused ? menu.first() : menu.next())
      }
    } else if (['Home', 'End', 'PageUp', 'PageDown'].includes(event.key)) {
      event.preventDefault()
    }
  }

  return (
    <Ariakit.MenuProvider store={menu}>
      <Ariakit.MenuButton
        onKeyDown={(event: KeyboardEvent) => setOpenedByArrow(event.key === 'ArrowDown' || event.key === 'ArrowUp')}
        onClick={() => setOpenedByArrow(false)}
        render={
          <IconButton
            label={c('Action').t`Sort by`}
            aria-label={c('Action').t`Change sort order`}
            shape="ghost"
            className="ml-auto shrink-0 px-2 aria-expanded:bg-[--interaction-default-active]"
          />
        }
      >
        <IcArrowDownArrowUp className="shrink-0" />
      </Ariakit.MenuButton>
      {/* Proton's dropdown: 8px from the button, 10em wide inside its border, 3px above and below the items,
          scaling from the corner next to the button from 75% and fading over 0.15s. */}
      <Menu
        ref={menuRef}
        // Proton's dropdown takes focus itself on click and Enter; the arrows still open on an option. Spread,
        // because an `initialFocus={undefined}` would replace Ariakit's choice of option.
        {...(openedByArrow ? {} : { initialFocus: menuRef })}
        onKeyDownCapture={onMenuKeyDownCapture}
        typeahead={false}
        modal={false}
        unmountOnHide
        gutter={8}
        // Proton's popper flips and shifts the dropdown right up to the viewport's edge.
        overflowPadding={0}
        style={{ transformOrigin: DROPDOWN_ORIGIN_BY_PLACEMENT[placement] }}
        className={clsx(
          'min-w-[calc(10em+2px)] !border-[--border-norm] !py-[.1875rem]',
          'scale-75 opacity-[0] data-[enter]:scale-100 data-[enter]:opacity-100',
          '[transition:transform_0.15s_cubic-bezier(0.33,1,0.68,1),opacity_0.15s_cubic-bezier(0.33,1,0.68,1)]',
        )}
      >
        <p className="m-0 px-4 py-2 text-[.875rem] font-bold">Sort by</p>
        {SORT_SELECT_OPTIONS.map(({ label, value }) => (
          <SortOption
            key={value}
            onClick={() => {
              setRecentsSort(value)
              reportTelemetry(TELEMETRY_EVENT_BY_SORT[value])
            }}
          >
            <span>{label()}</span>
            {sortValue === value ? <IcCheckmark /> : null}
          </SortOption>
        ))}
      </Menu>
    </Ariakit.MenuProvider>
  )
}

type SortOptionProps = Omit<Ariakit.MenuItemProps, 'className'>

/** Proton's `DropdownMenuButton`: its hover and pressed colours, and its focus ring drawn 3px inside the option. */
function SortOption(props: SortOptionProps) {
  return (
    <Ariakit.MenuItem
      // Proton's dropdown only highlights the hovered option.
      focusOnHover={false}
      {...props}
      className={clsx(
        'relative z-[1] flex w-full cursor-pointer select-none items-center gap-2 px-4 py-2 text-left text-[.875rem] leading-5 text-[--text-norm] [outline:none]',
        'bg-[--interaction-default] hover:bg-[--interaction-default-hover] active:bg-[--interaction-default-active]',
        '[transition:0.15s_cubic-bezier(0.22,1,0.36,1),background-position_0s]',
        "after:pointer-events-none after:absolute after:inset-[.1875rem] after:z-[2] after:rounded-[--border-radius-sm] after:border after:border-solid after:border-[transparent] after:content-[''] after:[transition:0.15s_cubic-bezier(0.5,1,0.89,1)]",
        'data-[focus-visible]:after:border-[--focus-outline] data-[focus-visible]:after:shadow-[0_0_0_.1875rem_var(--focus-ring)]',
        'data-[focus-visible]:hover:bg-[transparent] data-[focus-visible]:hover:after:bg-[--interaction-default-hover] data-[focus-visible]:active:bg-[transparent]',
      )}
    />
  )
}

/** As Proton's `isMac` (packages/shared/lib/helpers/browser.ts), which ua-parser-js reads from the user agent. */
function isMac() {
  const { userAgent } = navigator
  return /Macintosh|Mac OS X/.test(userAgent) && !/iPhone|iPad|iPod/.test(userAgent)
}
