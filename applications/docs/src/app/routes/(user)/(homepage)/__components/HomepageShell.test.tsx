import { render, screen } from '@testing-library/react'
import type { ComponentType, ReactNode } from 'react'

import useAppTitle from '@proton/components/hooks/useAppTitle'

import { HomepageShell } from './HomepageShell'

vi.mock('~/homepage', () => ({
  HomepageHeader: ({
    protonHeader: ProtonHeader,
    userDropdown: UserDropdown,
    reportDescriptionContext,
  }: {
    protonHeader: ComponentType
    userDropdown: ComponentType<{ app: string; reportDescriptionContext: string[] }>
    reportDescriptionContext: string[]
  }) => (
    <>
      Header {reportDescriptionContext.join(' ')}
      <ProtonHeader />
      <UserDropdown app="proton-docs" reportDescriptionContext={reportDescriptionContext} />
    </>
  ),
  HomepageSidebar: ({
    appsDropdown: AppsDropdown,
    appVersionComponent: AppVersion,
    logo: Logo,
    protonSidebar: ProtonSidebar,
    sidebarListItemLink: SidebarListItemLink,
    appVersion,
  }: {
    appsDropdown: ComponentType
    appVersionComponent: ComponentType<{ appVersion: string }>
    logo: ComponentType<{ appName: string }>
    protonSidebar: ComponentType
    sidebarListItemLink: ComponentType<{ children: ReactNode; to: string }>
    appVersion: string
  }) => (
    <>
      Sidebar {appVersion}
      <ProtonSidebar />
      <AppsDropdown />
      <Logo appName="proton-docs" />
      <AppVersion appVersion={appVersion} />
      <SidebarListItemLink to="/recents">Sidebar item link</SidebarListItemLink>
    </>
  ),
  HomepageStyleScope: ({ children }: { children: ReactNode }) => children,
  SidebarStateProvider: ({ children }: { children: ReactNode }) => children,
  useHomepageTitle: () => 'Recents',
}))
vi.mock('@proton/components/containers/app/PrivateAppContainer', () => ({
  default: ({
    containerRef,
    header,
    sidebar,
    children,
  }: {
    containerRef: (element: HTMLDivElement | null) => void
    header: ReactNode
    sidebar: ReactNode
    children: ReactNode
  }) => (
    <div ref={containerRef} data-testid="shell-container">
      <header>{header}</header>
      <aside>{sidebar}</aside>
      {children}
    </div>
  ),
}))
vi.mock('@proton/components/containers/layout/PrivateMainArea', () => ({
  default: ({ children }: { children: ReactNode }) => <main>{children}</main>,
}))
vi.mock('@proton/components/containers/topBanners/TopBanners', () => ({ default: () => null }))
vi.mock('@proton/components/components/drawer/DrawerApp', () => ({ default: () => null }))
vi.mock('@proton/components/components/logo/Logo', () => ({
  default: ({ appName }: { appName: string }) => `Logo ${appName}`,
}))
vi.mock('@proton/components/components/sidebar/Sidebar', () => ({ default: () => 'Proton sidebar' }))
vi.mock('@proton/components/components/sidebar/SidebarListItemLink', () => ({
  __esModule: true,
  default: ({ children }: { children: ReactNode }) => children,
}))
vi.mock('@proton/components/components/version/AppVersion', () => ({
  default: ({ appVersion, fullVersion }: { appVersion: string; fullVersion: string }) =>
    `App version ${appVersion} ${fullVersion}`,
}))
vi.mock('@proton/components/containers/app/AppsDropdown', () => ({ default: () => 'Apps dropdown' }))
vi.mock('@proton/components/containers/heading/PrivateHeader', () => ({ default: () => 'Private header' }))
vi.mock('@proton/components/containers/heading/UserDropdown', () => ({ default: () => 'User dropdown' }))
vi.mock('@proton/components/helpers/appVersion', () => ({
  getAppVersion: (appVersion: string) => `${appVersion}+commit`,
}))
vi.mock('@proton/components/hooks/useAppTitle', () => ({ __esModule: true, default: vi.fn() }))
vi.mock('@proton/app-context/useConfig', () => ({
  useConfig: () => ({ APP_VERSION: '1.0.0', CLIENT_TYPE: 1 }),
}))
describe('HomepageShell', () => {
  test('places the homepage parts in the Proton app frame', () => {
    render(<HomepageShell>Content</HomepageShell>)

    const banner = screen.getByRole('banner')
    expect(banner).toHaveTextContent(/^Header Automatically collected information:/)
    expect(banner).toHaveTextContent('Client version: 1.0.0+commit Client type: 1')
    expect(banner).toHaveTextContent(/Private headerUser dropdown$/)
    expect(screen.getByRole('complementary')).toHaveTextContent(
      'Sidebar 1.0.0Proton sidebarApps dropdownLogo proton-docsApp version 1.0.0 1.0.0+commitSidebar item link',
    )
    expect(screen.getByRole('main')).toHaveTextContent('Content')
    expect(screen.getByTestId('shell-container')).toHaveClass('is-homepage')
    expect(useAppTitle).toHaveBeenCalledWith('Recents')
  })
})
