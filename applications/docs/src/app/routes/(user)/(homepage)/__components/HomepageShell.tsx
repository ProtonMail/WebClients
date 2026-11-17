import type { ReactNode } from 'react'

import PasswordReminderTopBanner from '@proton/account-recovery/passwordReminder/PasswordReminderTopBanner'
import DrawerApp from '@proton/components/components/drawer/DrawerApp'
import Logo from '@proton/components/components/logo/Logo'
import ProtonSidebar from '@proton/components/components/sidebar/Sidebar'
import SidebarListItemLink from '@proton/components/components/sidebar/SidebarListItemLink'
import ProtonAppVersion from '@proton/components/components/version/AppVersion'
import AppsDropdown from '@proton/components/containers/app/AppsDropdown'
import PrivateAppContainer from '@proton/components/containers/app/PrivateAppContainer'
import PrivateHeader from '@proton/components/containers/heading/PrivateHeader'
import UserDropdown from '@proton/components/containers/heading/UserDropdown'
import PrivateMainArea from '@proton/components/containers/layout/PrivateMainArea'
import TopBanners from '@proton/components/containers/topBanners/TopBanners'
import { getAppVersion } from '@proton/components/helpers/appVersion'
import useAppTitle from '@proton/components/hooks/useAppTitle'
import { APPS } from '@proton/shared/lib/constants'

import { DocsQuickSettings } from '~/components/DocsQuickSettings'
import {
  HomepageHeader,
  type HomepageAppVersionComponentProps,
  HomepageSidebar,
  HomepageStyleScope,
  SidebarStateProvider,
  useHomepageTitle,
} from '~/homepage'

export type HomepageShellProps = {
  children: ReactNode
  reportDescriptionContext: string[]
  /** The host's `APP_VERSION`. */
  appVersion: string
}

function HomepageAppVersion({ appVersion: hostAppVersion }: HomepageAppVersionComponentProps) {
  const appVersion = getAppVersion(hostAppVersion)

  return <ProtonAppVersion appVersion={appVersion.split('+')[0]} fullVersion={appVersion} />
}

/** The Proton app frame around the dependency-light homepage module. */
export function HomepageShell({ children, reportDescriptionContext, appVersion }: HomepageShellProps) {
  useAppTitle(useHomepageTitle())

  return (
    <HomepageStyleScope>
      <SidebarStateProvider>
        <PrivateAppContainer
          containerRef={(element) => element?.classList.add('is-homepage')}
          top={
            <TopBanners app={APPS.PROTONDOCS}>
              <PasswordReminderTopBanner />
            </TopBanners>
          }
          header={
            <HomepageHeader
              protonHeader={PrivateHeader}
              userDropdown={UserDropdown}
              reportDescriptionContext={reportDescriptionContext}
            />
          }
          sidebar={
            <HomepageSidebar
              appsDropdown={AppsDropdown}
              appVersionComponent={HomepageAppVersion}
              logo={Logo}
              protonSidebar={ProtonSidebar}
              sidebarListItemLink={SidebarListItemLink}
              appVersion={appVersion}
            />
          }
          drawerApp={<DrawerApp customAppSettings={<DocsQuickSettings />} />}
        >
          <PrivateMainArea className="!border-t-0 small:ps-1 [&>div]:[block-size:100%]" hasToolbar>
            {children}
          </PrivateMainArea>
        </PrivateAppContainer>
      </SidebarStateProvider>
    </HomepageStyleScope>
  )
}
