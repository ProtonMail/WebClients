import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'

import { HomepageSidebar } from './HomepageSidebar'
import type { HomepageUserDropdownComponentProps } from './HomepageHeader'
import { HomepageViewContext, type HomepageViewValue } from './homepageViewContext'
import { SidebarStateProvider, useSidebarState } from './sidebarState'
import { DateFormatter } from './utils/dateFormatter'
import type { HomepageAppVersion } from './utils/appVersion'
import type { HomepageStorage } from './utils/storage'

const GB = 1024 ** 3

const mockRenderNothing = () => null
const mockLogo = ({ appName }: { appName: string }) => <div>Logo {appName}</div>
const mockUserDropdown = ({ app, hasAppLinks }: HomepageUserDropdownComponentProps) => (
  <button type="button">
    User dropdown {app} {hasAppLinks ? 'with app links' : 'without app links'}
  </button>
)

function MenuButton() {
  const { toggleExpanded } = useSidebarState()
  return (
    <button type="button" onClick={toggleExpanded}>
      Open navigation
    </button>
  )
}

function mockViewport(width: number) {
  // At the default 16px font size.
  const matches = (query: string) => width <= 16 * Number(/max-width: ([\d.]+)em/.exec(query)?.[1])
  window.matchMedia = vi.fn((query: string) => ({
    matches: matches(query),
    addEventListener: () => {},
    removeEventListener: () => {},
  })) as unknown as typeof window.matchMedia
}

function getSidebar() {
  return screen.getByRole('heading', { level: 1, name: 'Proton Docs' }).parentElement!
}

function renderSidebar({
  storage,
  appVersion = { version: '1.0.0', fullVersion: '1.0.0+abc' },
}: { storage?: HomepageStorage; appVersion?: HomepageAppVersion } = {}) {
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
    storage,
    appVersion,
  } as unknown as HomepageViewValue

  render(
    <MemoryRouter initialEntries={['/recents']}>
      <HomepageViewContext.Provider value={value}>
        <SidebarStateProvider>
          <MenuButton />
          <HomepageSidebar
            appsDropdown={mockRenderNothing}
            logo={mockLogo}
            userDropdown={mockUserDropdown}
            reportDescriptionContext={[]}
          />
        </SidebarStateProvider>
      </HomepageViewContext.Provider>
    </MemoryRouter>,
  )
  return { updateRecentDocuments, reloadInvitations, finishUpdate: () => finishUpdate(), value }
}

describe('HomepageSidebar', () => {
  beforeEach(() => mockViewport(1280))

  test('shows the injected logo', () => {
    renderSidebar()

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

  describe('storage', () => {
    test('shows the used and the maximum space, the meter and the app version', () => {
      renderSidebar({ storage: { usedSpace: GB, maxSpace: 2 * GB } })

      expect(screen.getByText('1.00 GB')).toBeInTheDocument()
      expect(screen.getByText('2.00 GB')).toBeInTheDocument()
      expect(screen.getByRole('meter')).toHaveAttribute('aria-valuenow', '50')
      expect(screen.getByRole('button', { name: 'Proton Docs 1.0.0' })).toBeInTheDocument()
      expect(screen.queryByRole('link', { name: /GB/ })).not.toBeInTheDocument()
    })

    test('the app version copies the full version, and says so', async () => {
      const writeText = vi.fn(() => Promise.resolve())
      Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true })
      const { value } = renderSidebar({ storage: { usedSpace: GB, maxSpace: 2 * GB } })

      await userEvent.click(screen.getByRole('button', { name: 'Proton Docs 1.0.0' }))

      expect(writeText).toHaveBeenCalledWith('1.0.0+abc')
      expect(value.createNotification).toHaveBeenCalledWith({
        text: 'Version number successfully copied to clipboard',
      })
    })

    test('the app version shows the early access mark', () => {
      renderSidebar({
        storage: { usedSpace: GB, maxSpace: 2 * GB },
        appVersion: { version: '1.0.0', fullVersion: '1.0.0+abc', earlyAccessMark: 'β' },
      })

      expect(screen.getByRole('button', { name: 'Proton Docs 1.0.0 β' })).toBeInTheDocument()
    })

    test('links to the upgrade, in this tab, when the host passes its link', () => {
      renderSidebar({ storage: { usedSpace: 0, maxSpace: 2 * GB, upgradeHref: 'https://account/upgrade' } })

      const link = screen.getByRole('link', { name: '0 bytes / 2.00 GB' })
      expect(link).toHaveAttribute('href', 'https://account/upgrade')
      expect(link).toHaveAttribute('target', '_self')
    })

    test('opens the upgrade in a new tab when the host asks, as in an iframe', () => {
      renderSidebar({
        storage: { usedSpace: 0, maxSpace: 2 * GB, upgradeHref: 'https://account/upgrade', openUpgradeInNewTab: true },
      })

      expect(screen.getByRole('link', { name: '0 bytes / 2.00 GB' })).toHaveAttribute('target', '_blank')
    })

    test('shows neither the storage nor the app version without storage, as Proton did', () => {
      renderSidebar()

      expect(screen.queryByRole('meter')).not.toBeInTheDocument()
      expect(screen.queryByRole('button', { name: /1\.0\.0/ })).not.toBeInTheDocument()
    })

    test('shows none when the maximum space is 0', () => {
      renderSidebar({ storage: { usedSpace: 0, maxSpace: 0 } })

      expect(screen.queryByRole('meter')).not.toBeInTheDocument()
    })
  })

  describe('wide viewports', () => {
    test('show the user dropdown only in the header', () => {
      renderSidebar()

      expect(screen.queryByRole('button', { name: /User dropdown/ })).not.toBeInTheDocument()
    })

    test('following a link leaves the sidebar closed', async () => {
      renderSidebar()

      await userEvent.click(screen.getByRole('link', { name: 'Trash' }))

      expect(getSidebar()).toHaveAttribute('data-expanded', 'false')
    })
  })

  describe('narrow viewports', () => {
    beforeEach(() => mockViewport(400))

    test('show the user dropdown with the app links, as the apps dropdown is hidden', () => {
      renderSidebar()

      expect(screen.getByRole('button', { name: 'User dropdown proton-docs with app links' })).toBeInTheDocument()
    })

    test('the menu button opens the drawer, which takes the focus', async () => {
      renderSidebar()

      await userEvent.click(screen.getByRole('button', { name: 'Open navigation' }))

      expect(getSidebar()).toHaveAttribute('data-expanded', 'true')
      expect(getSidebar()).toHaveFocus()
    })

    test('following a link closes the drawer', async () => {
      renderSidebar()
      await userEvent.click(screen.getByRole('button', { name: 'Open navigation' }))

      await userEvent.click(screen.getByRole('link', { name: 'Trash' }))

      expect(getSidebar()).toHaveAttribute('data-expanded', 'false')
    })

    test('the close button closes the drawer', async () => {
      renderSidebar()
      await userEvent.click(screen.getByRole('button', { name: 'Open navigation' }))

      await userEvent.click(screen.getByRole('button', { name: 'Close navigation' }))

      expect(getSidebar()).toHaveAttribute('data-expanded', 'false')
    })

    test('a click on the backdrop closes the drawer', async () => {
      renderSidebar()
      await userEvent.click(screen.getByRole('button', { name: 'Open navigation' }))

      await userEvent.click(getSidebar().nextElementSibling!)

      expect(getSidebar()).toHaveAttribute('data-expanded', 'false')
    })

    test('Tab and Shift+Tab cycle within the open drawer', async () => {
      renderSidebar()
      await userEvent.click(screen.getByRole('button', { name: 'Open navigation' }))
      const closeButton = screen.getByRole('button', { name: 'Close navigation' })
      const driveLink = screen.getByRole('link', { name: /Go to Proton Drive/ })

      driveLink.focus()
      await userEvent.tab()
      expect(closeButton).toHaveFocus()

      await userEvent.tab({ shift: true })
      expect(driveLink).toHaveFocus()
    })
  })
})
