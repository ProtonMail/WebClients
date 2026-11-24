import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ReactNode } from 'react'
import { MemoryRouter } from 'react-router'
import { NavLink } from 'react-router-dom'

import {
  HomepageSidebar,
  type HomepageSidebarComponentProps,
  type HomepageSidebarListItemLinkComponentProps,
} from './HomepageSidebar'
import { HomepageViewContext, type HomepageViewValue } from './homepageViewContext'
import { SidebarStateProvider } from './sidebarState'
import { DateFormatter } from './utils/dateFormatter'

const mockRenderChildren = ({
  children,
  logo,
  version,
}: {
  children?: ReactNode
  logo?: ReactNode
  version?: ReactNode
}) => (
  <div>
    {logo}
    {version}
    {children}
  </div>
)
const mockRenderNothing = () => null
const mockAppVersion = ({ appVersion }: { appVersion: string }) => <div>App version {appVersion}</div>
const mockLogo = ({ appName }: { appName: string }) => <div>Logo {appName}</div>
const mockSidebarListItemLink = ({ children }: HomepageSidebarListItemLinkComponentProps) => children

/** Proton's sidebar, reduced to whether it is open, the button that toggles it, and its links. */
const mockToggleSidebar = ({ expanded, onToggleExpand, children }: HomepageSidebarComponentProps) => (
  <div>
    <output aria-label="Sidebar">{expanded ? 'open' : 'closed'}</output>
    <button type="button" onClick={onToggleExpand}>
      Toggle sidebar
    </button>
    {children}
  </div>
)
const mockNavLink = ({ to, exact, children }: HomepageSidebarListItemLinkComponentProps) => (
  <NavLink to={to} exact={exact}>
    {children}
  </NavLink>
)

function renderSidebar({
  protonSidebar = mockRenderChildren,
  sidebarListItemLink = mockSidebarListItemLink,
}: {
  protonSidebar?: (props: HomepageSidebarComponentProps) => ReactNode
  sidebarListItemLink?: (props: HomepageSidebarListItemLinkComponentProps) => ReactNode
} = {}) {
  let finishUpdate = () => {}
  const updateRecentDocuments = vi.fn(
    () =>
      new Promise<void>((resolve) => {
        finishUpdate = resolve
      }),
  )
  const reloadInvitations = vi.fn()
  const value = {
    state: { view: 'recents-empty' },
    setSearch: vi.fn(),
    updateRecentDocuments,
    reloadInvitations,
    isRecentsUpdating: false,
    type: undefined,
    reportTelemetry: vi.fn(),
    createNotification: vi.fn(),
    getAppHref: (path: string) => path,
    dateFormatter: new DateFormatter({ localeCode: 'en-US', hourCycle: 'h12' }),
  } as unknown as HomepageViewValue

  render(
    <MemoryRouter initialEntries={['/recents']}>
      <HomepageViewContext.Provider value={value}>
        <SidebarStateProvider>
          <HomepageSidebar
            appsDropdown={mockRenderNothing}
            appVersionComponent={mockAppVersion}
            logo={mockLogo}
            protonSidebar={protonSidebar}
            sidebarListItemLink={sidebarListItemLink}
            appVersion="1.0.0"
          />
        </SidebarStateProvider>
      </HomepageViewContext.Provider>
    </MemoryRouter>,
  )
  return { updateRecentDocuments, reloadInvitations, finishUpdate: () => finishUpdate(), value }
}

describe('HomepageSidebar', () => {
  test('passes the host app version to the injected component', () => {
    renderSidebar()

    expect(screen.getByText('App version 1.0.0')).toBeInTheDocument()
    expect(screen.getByText('Logo proton-docs')).toBeInTheDocument()
  })

  test('the reload button reloads the invitations with the recent documents', async () => {
    const { updateRecentDocuments, reloadInvitations, finishUpdate, value } = renderSidebar()

    await userEvent.click(screen.getByRole('button', { name: 'Update recent documents' }))

    expect(reloadInvitations).toHaveBeenCalledTimes(1)
    expect(updateRecentDocuments).toHaveBeenCalledTimes(1)
    finishUpdate()
    await waitFor(() => expect(value.createNotification).toHaveBeenCalledWith({ text: 'Recent documents updated' }))
  })

  test('rendering the sidebar does not reload the invitations', () => {
    const { reloadInvitations } = renderSidebar()

    expect(reloadInvitations).not.toHaveBeenCalled()
  })

  test('closes once a link is followed, as on narrow viewports where it is open', async () => {
    renderSidebar({ protonSidebar: mockToggleSidebar, sidebarListItemLink: mockNavLink })
    await userEvent.click(screen.getByRole('button', { name: 'Toggle sidebar' }))
    expect(screen.getByRole('status', { name: 'Sidebar' })).toHaveTextContent('open')

    await userEvent.click(screen.getByRole('link', { name: 'Trash' }))

    expect(screen.getByRole('status', { name: 'Sidebar' })).toHaveTextContent('closed')
  })

  test('following a link while it is closed, as on wide viewports, leaves it closed', async () => {
    renderSidebar({ protonSidebar: mockToggleSidebar, sidebarListItemLink: mockNavLink })

    await userEvent.click(screen.getByRole('link', { name: 'Trash' }))

    expect(screen.getByRole('status', { name: 'Sidebar' })).toHaveTextContent('closed')
  })
})
