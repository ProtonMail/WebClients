import '@testing-library/jest-dom'
import { act, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { HomepageViewContext, type HomepageViewValue, type RecentsSort } from '../homepageViewContext'
import { SortSelect } from './SortSelect'
import { TelemetryEvent } from '../utils/telemetry'
import type { ReactNode } from 'react'

const setRecentsSort = jest.fn()
const reportTelemetry = jest.fn()

function renderSortSelect(sort: RecentsSort = 'viewed') {
  const value = {
    state: { view: 'recents', itemSections: [], sort },
    setRecentsSort,
    reportTelemetry,
  } as unknown as HomepageViewValue
  render(<SortSelect />, {
    wrapper: ({ children }: { children: ReactNode }) => (
      <HomepageViewContext.Provider value={value}>{children}</HomepageViewContext.Provider>
    ),
  })
  const trigger = screen.getByRole('button', { name: 'Change sort order' })
  // JSDOM has no layout; Ariakit checks that what it focuses is visible, including the menu it mounts on open.
  jest.spyOn(HTMLElement.prototype, 'offsetWidth', 'get').mockReturnValue(1)
  return trigger
}

const option = (name: string) => screen.getByRole('menuitem', { name })

describe('SortSelect', () => {
  afterEach(() => {
    jest.restoreAllMocks()
    jest.clearAllMocks()
    jest.useRealTimers()
  })

  it('Opens a menu of the sort options on click, with a checkmark on the current one', async () => {
    const trigger = renderSortSelect('name')

    await userEvent.click(trigger)

    const menu = screen.getByRole('menu')
    expect(menu).toHaveTextContent(/^Sort by/)
    const items = screen.getAllByRole('menuitem')
    expect(items.map((item) => item.textContent)).toEqual(['Last viewed first', 'Name', 'Created by', 'Location'])
    expect(items.map((item) => item.querySelector('svg') !== null)).toEqual([false, true, false, false])
  })

  it('Scales from the corner next to the button, as Proton did', async () => {
    const trigger = renderSortSelect()

    await userEvent.click(trigger)

    expect(screen.getByRole('menu')).toHaveStyle({ transformOrigin: 'top right' })
  })

  it('Sets the chosen sort, reports it and closes, returning focus to the button', async () => {
    const trigger = renderSortSelect()

    await userEvent.click(trigger)
    await userEvent.click(screen.getByRole('menuitem', { name: 'Created by' }))

    expect(setRecentsSort).toHaveBeenCalledWith('owner')
    expect(reportTelemetry).toHaveBeenCalledWith(TelemetryEvent.sorting_changed_to_owner)
    await waitFor(() => expect(screen.queryByRole('menu')).toBeNull())
    await waitFor(() => expect(trigger).toHaveFocus())
  })

  it('Opens from the keyboard on the first option, moves with the arrows and closes on Escape', async () => {
    const trigger = renderSortSelect()
    act(() => trigger.focus())

    await userEvent.keyboard('{ArrowDown}')
    await waitFor(() => expect(screen.getByRole('menuitem', { name: 'Last viewed first' })).toHaveFocus())
    await userEvent.keyboard('{ArrowDown}')
    expect(screen.getByRole('menuitem', { name: 'Name' })).toHaveFocus()
    await userEvent.keyboard('{Escape}')

    await waitFor(() => expect(screen.queryByRole('menu')).toBeNull())
    expect(trigger).toHaveFocus()
    expect(setRecentsSort).not.toHaveBeenCalled()
  })

  it('Opens on Enter with focus on the menu, as Proton did, and ArrowDown then reaches the first option', async () => {
    const trigger = renderSortSelect()
    act(() => trigger.focus())

    await userEvent.keyboard('{Enter}')
    await waitFor(() => expect(screen.getByRole('menu')).toHaveFocus())
    await userEvent.keyboard('{ArrowDown}')

    expect(screen.getByRole('menuitem', { name: 'Last viewed first' })).toHaveFocus()
  })

  it('Wraps the arrows round, jumps to the ends with Ctrl+arrows off macOS and ignores other keys, as Proton did', async () => {
    const trigger = renderSortSelect()
    act(() => trigger.focus())
    await userEvent.keyboard('{ArrowUp}')
    await waitFor(() => expect(option('Location')).toHaveFocus())

    await userEvent.keyboard('{ArrowDown}')
    expect(option('Last viewed first')).toHaveFocus()
    await userEvent.keyboard('{ArrowUp}')
    expect(option('Location')).toHaveFocus()
    await userEvent.keyboard('{Control>}{ArrowUp}{/Control}')
    expect(option('Last viewed first')).toHaveFocus()
    await userEvent.keyboard('{Control>}{ArrowDown}{/Control}')
    expect(option('Location')).toHaveFocus()
    await userEvent.keyboard('{Meta>}{ArrowUp}{/Meta}{Shift>}{ArrowUp}{/Shift}{Home}n')
    expect(option('Location')).toHaveFocus()
    await userEvent.keyboard('{ArrowUp}{End}')
    expect(option('Created by')).toHaveFocus()
  })

  it('Jumps to the ends with Cmd+arrows on macOS, as Proton did', async () => {
    jest.spyOn(window.navigator, 'userAgent', 'get').mockReturnValue('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)')
    const trigger = renderSortSelect()
    act(() => trigger.focus())
    await userEvent.keyboard('{ArrowDown}')
    await waitFor(() => expect(option('Last viewed first')).toHaveFocus())

    await userEvent.keyboard('{Meta>}{ArrowDown}{/Meta}')
    expect(option('Location')).toHaveFocus()
    await userEvent.keyboard('{Control>}{ArrowUp}{/Control}')
    expect(option('Location')).toHaveFocus()
  })

  it('Keeps Tab and Shift+Tab inside the open menu, moving through the options, as Proton did', async () => {
    const trigger = renderSortSelect()
    act(() => trigger.focus())
    await userEvent.keyboard('{Enter}')
    await waitFor(() => expect(screen.getByRole('menu')).toHaveFocus())

    await userEvent.tab()
    expect(option('Last viewed first')).toHaveFocus()
    await userEvent.tab({ shift: true })
    expect(option('Location')).toHaveFocus()
    await userEvent.tab()
    expect(option('Last viewed first')).toHaveFocus()
    await userEvent.tab()

    expect(option('Name')).toHaveFocus()
    expect(screen.getByRole('menu')).toBeVisible()
  })

  it('Closes on Escape when opened while its tooltip shows', async () => {
    jest.useFakeTimers()
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime })
    const trigger = renderSortSelect()
    await user.hover(trigger)
    act(() => jest.advanceTimersByTime(1000))
    expect(screen.getByText('Sort by')).toBeVisible()

    await user.click(trigger)
    expect(screen.getByRole('menu')).toBeVisible()
    await user.keyboard('{Escape}')

    await waitFor(() => expect(screen.queryByRole('menu')).toBeNull())
  })
})
