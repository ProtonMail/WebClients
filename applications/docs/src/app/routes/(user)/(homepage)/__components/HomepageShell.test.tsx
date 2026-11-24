import { render, screen } from '@testing-library/react'
import type { ComponentType, ReactNode } from 'react'

import PrivateHeader from '@proton/components/containers/heading/PrivateHeader'
import useAppTitle from '@proton/components/hooks/useAppTitle'

import { HomepageShell } from './HomepageShell'

vi.mock('~/homepage', () => ({
  HomepageLayout: ({
    top,
    sidebar,
    header,
    drawerApp,
    children,
  }: {
    top: ReactNode
    sidebar: ReactNode
    header: ReactNode
    drawerApp: ReactNode
    children: ReactNode
  }) => (
    <div data-testid="layout">
      {top}
      <aside>{sidebar}</aside>
      <header>{header}</header>
      <main>{children}</main>
      {drawerApp}
    </div>
  ),
  HomepageHeader: ({ headerActions: HeaderActions }: { headerActions: ComponentType<{ isNarrow: boolean }> }) => (
    <HeaderActions isNarrow={false} />
  ),
  HomepageSidebar: ({
    appsDropdown: AppsDropdown,
    logo: Logo,
    userDropdown: UserDropdown,
    reportDescriptionContext,
  }: {
    appsDropdown: ComponentType
    logo: ComponentType<{ appName: string }>
    userDropdown: ComponentType<{ app: string; reportDescriptionContext: string[] }>
    reportDescriptionContext: string[]
  }) => (
    <>
      Sidebar
      <AppsDropdown />
      <Logo appName="proton-docs" />
      <UserDropdown app="proton-docs" reportDescriptionContext={reportDescriptionContext} />
    </>
  ),
  HomepageStyleScope: ({ children }: { children: ReactNode }) => <div data-testid="style-scope">{children}</div>,
  SidebarStateProvider: ({ children }: { children: ReactNode }) => children,
  useHomepageTitle: () => 'Recents',
}))
vi.mock('@proton/components/containers/topBanners/TopBanners', () => ({
  default: ({ children }: { children: ReactNode }) => <div>Top banners {children}</div>,
}))
vi.mock('@proton/account-recovery/passwordReminder/PasswordReminderTopBanner', () => ({
  default: () => 'Password reminder',
}))
vi.mock('@proton/components/components/drawer/DrawerApp', () => ({ default: () => 'Drawer app' }))
vi.mock('~/components/DocsQuickSettings', () => ({ DocsQuickSettings: () => null }))
vi.mock('@proton/components/components/logo/Logo', () => ({
  default: ({ appName }: { appName: string }) => `Logo ${appName}`,
}))
vi.mock('@proton/components/containers/app/AppsDropdown', () => ({ default: () => 'Apps dropdown' }))
vi.mock('@proton/components/containers/heading/PrivateHeader', () => ({
  __esModule: true,
  default: vi.fn(({ userDropdown }: { userDropdown: ReactNode }) => <header>Private header {userDropdown}</header>),
}))
vi.mock('@proton/components/containers/heading/UserDropdown', () => ({ default: () => 'User dropdown' }))
vi.mock('@proton/components/hooks/useAppTitle', () => ({ __esModule: true, default: vi.fn() }))
vi.mock('@proton/app-context/useConfig', () => ({
  useConfig: () => ({ APP_VERSION: '1.0.0', CLIENT_TYPE: 1 }),
}))

describe('HomepageShell', () => {
  test('passes the Proton parts to the homepage layout', () => {
    render(<HomepageShell>Content</HomepageShell>)

    const layout = screen.getByTestId('layout')
    expect(layout).toHaveTextContent(/^Top banners Password reminder/)
    expect(layout).toHaveTextContent(/Drawer app$/)
    expect(screen.getByRole('complementary')).toHaveTextContent('SidebarApps dropdownLogo proton-docsUser dropdown')
    expect(screen.getByRole('main')).toHaveTextContent('Content')
    expect(useAppTitle).toHaveBeenCalledWith('Recents')
  })

  test("keeps the Docs app's homepage styles and Proton's colours outside the module's style scope", () => {
    render(<HomepageShell>Content</HomepageShell>)

    // Outside, so the colour tokens the module sets on its root apply over Proton's.
    expect(screen.getByTestId('style-scope').parentElement).toHaveClass('is-homepage', 'ui-standard')
  })

  test("the header's actions are Proton's, without its menu button or frame", () => {
    render(<HomepageShell>Content</HomepageShell>)

    // Proton's own `<header>` isn't a second banner.
    expect(screen.getByRole('banner')).toHaveTextContent('Private header User dropdown')
    expect(vi.mocked(PrivateHeader).mock.lastCall?.[0]).toEqual(
      expect.objectContaining({
        app: 'proton-drive',
        hideMenuButton: true,
        isSmallViewport: false,
        className: expect.stringContaining('!contents'),
      }),
    )
  })
})
