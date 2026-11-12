import '@testing-library/jest-dom'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ReactNode } from 'react'
import { MemoryRouter } from 'react-router'

import { HomepageLayout } from './HomepageLayout'
import { HomepageViewContext, type HomepageViewValue } from './homepageViewContext'
import { DateFormatter } from './utils/dateFormatter'

// The Proton app frame needs the Proton app's providers. These tests need only the sidebar's content.
const mockRenderChildren = ({ children }: { children?: ReactNode }) => <div>{children}</div>
const mockRenderNothing = () => null
jest.mock('@proton/components/containers/app/PrivateAppContainer', () => ({
  __esModule: true,
  default: ({ sidebar, children }: { sidebar: ReactNode; children: ReactNode }) => (
    <div>
      {sidebar}
      {children}
    </div>
  ),
}))
jest.mock('@proton/components/components/sidebar/Sidebar', () => ({
  __esModule: true,
  default: (props: { children?: ReactNode }) => mockRenderChildren(props),
}))
jest.mock('@proton/components/components/sidebar/SidebarNav', () => ({
  __esModule: true,
  default: (props: { children?: ReactNode }) => mockRenderChildren(props),
}))
jest.mock('@proton/components/components/sidebar/SidebarList', () => ({
  __esModule: true,
  default: (props: { children?: ReactNode }) => mockRenderChildren(props),
}))
jest.mock('@proton/components/components/sidebar/SidebarListItem', () => ({
  __esModule: true,
  default: (props: { children?: ReactNode }) => mockRenderChildren(props),
}))
jest.mock('@proton/components/components/sidebar/SidebarListItemLink', () => ({
  __esModule: true,
  default: (props: { children?: ReactNode }) => mockRenderChildren(props),
}))
jest.mock('@proton/components/components/sidebar/SidebarListItemDiv', () => ({
  __esModule: true,
  default: (props: { children?: ReactNode }) => mockRenderChildren(props),
}))
jest.mock('@proton/components/containers/layout/PrivateMainArea', () => ({
  __esModule: true,
  default: (props: { children?: ReactNode }) => mockRenderChildren(props),
}))
jest.mock('@proton/components/containers/topBanners/TopBanners', () => ({
  __esModule: true,
  default: () => mockRenderNothing(),
}))
jest.mock('@proton/components/components/drawer/DrawerApp', () => ({
  __esModule: true,
  default: () => mockRenderNothing(),
}))
jest.mock('@proton/components/containers/app/AppsDropdown', () => ({
  __esModule: true,
  default: () => mockRenderNothing(),
}))
jest.mock('@proton/components/components/logo/Logo', () => ({ __esModule: true, default: () => mockRenderNothing() }))
jest.mock('@proton/components/components/version/AppVersion', () => ({
  __esModule: true,
  default: () => mockRenderNothing(),
}))
jest.mock('@proton/components/hooks/useAppTitle', () => ({ __esModule: true, default: () => {} }))

function renderLayout() {
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
        <HomepageLayout reportDescriptionContext={[]} quickSettings={null} appVersion="1.0.0">
          <div />
        </HomepageLayout>
      </HomepageViewContext.Provider>
    </MemoryRouter>,
  )
  return { updateRecentDocuments, reloadInvitations, finishUpdate: () => finishUpdate(), value }
}

describe('HomepageLayout sidebar', () => {
  test('the reload button reloads the invitations with the recent documents', async () => {
    const { updateRecentDocuments, reloadInvitations, finishUpdate, value } = renderLayout()

    await userEvent.click(screen.getByRole('button', { name: 'Update recent documents' }))

    expect(reloadInvitations).toHaveBeenCalledTimes(1)
    expect(updateRecentDocuments).toHaveBeenCalledTimes(1)
    finishUpdate()
    await waitFor(() => expect(value.createNotification).toHaveBeenCalledWith({ text: 'Recent documents updated' }))
  })

  test('rendering the layout does not reload the invitations', () => {
    const { reloadInvitations } = renderLayout()

    expect(reloadInvitations).not.toHaveBeenCalled()
  })
})
