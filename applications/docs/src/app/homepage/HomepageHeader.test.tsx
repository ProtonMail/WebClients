import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ReactNode } from 'react'
import { MemoryRouter, useLocation } from 'react-router'
import { CompatRouter } from 'react-router-dom-v5-compat'

import { HomepageHeader, type HomepageHeaderActionsComponentProps } from './HomepageHeader'
import { HomepageViewContext, type HomepageViewState, type HomepageViewValue } from './homepageViewContext'
import { useSearch, useType } from './homepageViewUtils'
import { SidebarStateProvider, useSidebarState } from './sidebarState'

function mockViewport(width: number) {
  // At the default 16px font size.
  const matches = (query: string) => width <= 16 * Number(/max-width: ([\d.]+)em/.exec(query)?.[1])
  window.matchMedia = vi.fn((query: string) => ({
    matches: matches(query),
    addEventListener: () => {},
    removeEventListener: () => {},
  })) as unknown as typeof window.matchMedia
}

function SidebarExpanded() {
  const { expanded } = useSidebarState()
  return <output aria-label="Sidebar">{expanded ? 'open' : 'closed'}</output>
}

function renderHeader() {
  const value = {
    state: { view: 'recents-empty' },
    setSearch: vi.fn(),
    type: undefined,
  } as unknown as HomepageViewValue

  function HeaderActions({ isNarrow }: HomepageHeaderActionsComponentProps) {
    return <div>Header actions {isNarrow ? 'narrow' : 'wide'}</div>
  }

  render(
    <MemoryRouter initialEntries={['/recents']}>
      <HomepageViewContext.Provider value={value}>
        <SidebarStateProvider>
          <HomepageHeader headerActions={HeaderActions} />
          <SidebarExpanded />
        </SidebarStateProvider>
      </HomepageViewContext.Provider>
    </MemoryRouter>,
  )
}

describe('HomepageHeader', () => {
  beforeEach(() => mockViewport(1280))

  test('shows the search and the host actions in a banner', () => {
    renderHeader()

    const banner = screen.getByRole('banner')
    expect(banner).toContainElement(screen.getByPlaceholderText('Search recents'))
    expect(banner).toHaveTextContent('Header actions wide')
  })

  test('tells the host actions whether the viewport is narrow', () => {
    mockViewport(400)
    renderHeader()

    expect(screen.getByText('Header actions narrow')).toBeInTheDocument()
  })

  test('the menu button opens and closes the sidebar', async () => {
    renderHeader()
    const menuButton = screen.getByRole('button', { name: 'Open navigation' })
    expect(menuButton).toHaveAttribute('aria-expanded', 'false')

    await userEvent.click(menuButton)

    expect(screen.getByRole('status', { name: 'Sidebar' })).toHaveTextContent('open')
    await userEvent.click(screen.getByRole('button', { name: 'Close navigation' }))
    expect(screen.getByRole('status', { name: 'Sidebar' })).toHaveTextContent('closed')
  })
})

type SearchView = 'search' | 'search-loading'

function getState(searchView: SearchView, search: string | undefined): HomepageViewState {
  if (!search) {
    return { view: 'recents-empty' }
  }
  if (searchView === 'search') {
    return { view: 'search', query: search, itemSections: [] }
  }
  return { view: searchView, query: search }
}

/** The view's search, on the real query string, as HomepageViewProvider has it. */
function SearchViewProvider({ searchView, children }: { searchView: SearchView; children: ReactNode }) {
  const [search, setSearch] = useSearch()
  const [type] = useType()
  const state = getState(searchView, search)
  return (
    <HomepageViewContext.Provider value={{ state, type, setSearch } as unknown as HomepageViewValue}>
      {children}
    </HomepageViewContext.Provider>
  )
}

function CurrentLocation() {
  const { pathname, search } = useLocation()
  return <output aria-label="Location">{`${pathname}${search}`}</output>
}

function renderSearch({ path = '/recents', searchView = 'search' }: { path?: string; searchView?: SearchView } = {}) {
  render(
    <MemoryRouter initialEntries={[path]}>
      <CompatRouter>
        <SearchViewProvider searchView={searchView}>
          <SidebarStateProvider>
            <HomepageHeader headerActions={() => null} />
          </SidebarStateProvider>
          <CurrentLocation />
        </SearchViewProvider>
      </CompatRouter>
    </MemoryRouter>,
  )
}

const getLocation = () => screen.getByRole('status', { name: 'Location' }).textContent
// On wide viewports. The narrow one starts as a button, and CSS hides the other.
const getWideField = () => screen.getAllByRole('textbox').at(-1)!

describe('HomepageHeader search', () => {
  test('typing in the trash searches the recents', async () => {
    renderSearch({ path: '/trash' })

    await userEvent.type(getWideField(), 'plan')

    expect(getLocation()).toBe('/recents?q=plan')
  })

  test('keeps what was typed while the recents load', async () => {
    renderSearch({ path: '/trash', searchView: 'search-loading' })

    await userEvent.type(getWideField(), 'plan')

    expect(getLocation()).toBe('/recents?q=plan')
    expect(getWideField()).toHaveValue('plan')
  })

  test('searching keeps the type filter', async () => {
    renderSearch({ path: '/recents?type=spreadsheet' })

    await userEvent.type(getWideField(), 'plan')

    expect(getLocation()).toBe('/recents?type=spreadsheet&q=plan')
  })

  test('Escape clears the search and keeps the other parameters', async () => {
    renderSearch({ path: '/recents?sort=name&q=plan' })

    await userEvent.type(getWideField(), '{Escape}')

    expect(getLocation()).toBe('/recents?sort=name')
    expect(getWideField()).toHaveValue('')
  })

  test('the field names the documents it searches', () => {
    renderSearch({ path: '/recents?type=spreadsheet' })

    expect(getWideField()).toHaveAttribute('placeholder', 'Search recent spreadsheets')
  })

  describe('on narrow viewports', () => {
    test('names the page, and its button opens a field with the focus', async () => {
      renderSearch({ path: '/trash' })

      expect(screen.getByText('Trash')).toBeInTheDocument()
      await userEvent.click(screen.getByRole('button', { name: 'Search recents' }))

      expect(screen.getAllByRole('textbox')).toHaveLength(2)
      expect(screen.getAllByRole('textbox')[0]).toHaveFocus()
    })

    test('the field closes when it loses the focus empty, and stays open with a search', async () => {
      renderSearch()
      await userEvent.click(screen.getByRole('button', { name: 'Search recents' }))

      act(() => screen.getAllByRole('textbox')[0].blur())

      expect(screen.getByRole('button', { name: 'Search recents' })).toBeInTheDocument()

      await userEvent.click(screen.getByRole('button', { name: 'Search recents' }))
      await userEvent.keyboard('plan')
      act(() => screen.getAllByRole('textbox')[0].blur())

      expect(screen.queryByRole('button', { name: 'Search recents' })).not.toBeInTheDocument()
      expect(screen.getAllByRole('textbox')[0]).toHaveValue('plan')
    })
  })
})
