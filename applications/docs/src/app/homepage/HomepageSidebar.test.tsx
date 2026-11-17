import '@testing-library/jest-dom'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ReactNode } from 'react'
import { MemoryRouter } from 'react-router'

import { HomepageSidebar, type HomepageSidebarListItemLinkComponentProps } from './HomepageSidebar'
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

function renderSidebar() {
  let finishUpdate = () => {}
  const updateRecentDocuments = jest.fn(
    () =>
      new Promise<void>((resolve) => {
        finishUpdate = resolve
      }),
  )
  const reloadInvitations = jest.fn()
  const value = {
    state: { view: 'recents-empty' },
    setSearch: jest.fn(),
    updateRecentDocuments,
    reloadInvitations,
    isRecentsUpdating: false,
    type: undefined,
    reportTelemetry: jest.fn(),
    createNotification: jest.fn(),
    getAppHref: (path: string) => path,
    dateFormatter: new DateFormatter('en-US'),
  } as unknown as HomepageViewValue

  render(
    <MemoryRouter initialEntries={['/recents']}>
      <HomepageViewContext.Provider value={value}>
        <SidebarStateProvider>
          <HomepageSidebar
            appsDropdown={mockRenderNothing}
            appVersionComponent={mockAppVersion}
            logo={mockLogo}
            protonSidebar={mockRenderChildren}
            sidebarListItemLink={mockSidebarListItemLink}
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
})
