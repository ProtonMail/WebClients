import type { ReactNode } from 'react'

import { useConfig } from '@proton/app-context/useConfig'
import PasswordReminderTopBanner from '@proton/account-recovery/passwordReminder/PasswordReminderTopBanner'
import DrawerApp from '@proton/components/components/drawer/DrawerApp'
import Logo from '@proton/components/components/logo/Logo'
import AppsDropdown from '@proton/components/containers/app/AppsDropdown'
import PrivateHeader from '@proton/components/containers/heading/PrivateHeader'
import UserDropdown from '@proton/components/containers/heading/UserDropdown'
import TopBanners from '@proton/components/containers/topBanners/TopBanners'
import useAppTitle from '@proton/components/hooks/useAppTitle'
import { APPS } from '@proton/shared/lib/constants'
import clsx from '@proton/utils/clsx'

import { DocsQuickSettings } from '~/components/DocsQuickSettings'
import {
  HomepageHeader,
  type HomepageHeaderActionsComponentProps,
  type HomepageUserDropdownComponentProps,
  HomepageLayout,
  HomepageSidebar,
  HomepageStyleScope,
  SidebarStateProvider,
  useHomepageTitle,
} from '~/homepage'
import { getDocsReportContextLines } from '~/utils/report-context'

export type HomepageShellProps = {
  children: ReactNode
}

function useReportDescriptionContext() {
  const { APP_VERSION, CLIENT_TYPE } = useConfig()
  return getDocsReportContextLines({ appVersion: APP_VERSION, clientType: CLIENT_TYPE })
}

// The Docs homepage's sizes for the name and initials of Proton's user dropdown.
const USER_DROPDOWN_OVERRIDES =
  '[&_.user-dropdown-displayName]:font-[0.8571428571em] [&_.user-dropdown-displayName]:leading-[1.2] [&_.user-initials]:!leading-[1.0714rem]'

type HomepageSidebarUserDropdownProps = HomepageUserDropdownComponentProps

/** Proton's user dropdown, in the sidebar's drawer on narrow viewports. */
function HomepageSidebarUserDropdown(props: HomepageSidebarUserDropdownProps) {
  return (
    <div className={clsx('contents', USER_DROPDOWN_OVERRIDES)}>
      <UserDropdown {...props} />
    </div>
  )
}

/**
 * Proton's `PrivateHeader`, reduced to its actions: the business onboarding button, the upsell (for Drive, as the
 * homepage always passed) and the user dropdown, with the storefront cookies it sets. Its frame is flattened into the
 * homepage's header (`contents`), its menu button hidden, and the empty box it keeps for an action area removed.
 */
function HomepageHeaderActions({ isNarrow }: HomepageHeaderActionsComponentProps) {
  const reportDescriptionContext = useReportDescriptionContext()

  return (
    // Its `<header>` sits in the homepage's, which is the page's banner: `role="none"` keeps it from being a second
    // one. `PrivateHeader` doesn't pass other props to its `<header>`, so the role is set on the element.
    <div
      className={clsx('contents', USER_DROPDOWN_OVERRIDES)}
      ref={(element) => element?.querySelector('header')?.setAttribute('role', 'none')}
    >
      <PrivateHeader
        className="!contents [&>div:empty]:!hidden"
        hideMenuButton
        app={APPS.PROTONDRIVE}
        userDropdown={<UserDropdown app={APPS.PROTONDOCS} reportDescriptionContext={reportDescriptionContext} />}
        isSmallViewport={isNarrow}
        expanded={false}
      />
    </div>
  )
}

/** The Proton parts of the homepage around the dependency-light homepage module, which lays out the page. */
export function HomepageShell({ children }: HomepageShellProps) {
  useAppTitle(useHomepageTitle())
  const reportDescriptionContext = useReportDescriptionContext()

  return (
    // `is-homepage` keeps the Docs app's styles for the document pages out (app.scss). `ui-standard` gives Proton's
    // widgets the colours they had in Proton's frame: outside `HomepageStyleScope`, so that the module's own colour
    // tokens, which it sets on its root, apply over Proton's.
    <div className="is-homepage ui-standard contents">
      <HomepageStyleScope>
        <SidebarStateProvider>
          <HomepageLayout
            top={
              <TopBanners app={APPS.PROTONDOCS}>
                <PasswordReminderTopBanner />
              </TopBanners>
            }
            sidebar={
              <HomepageSidebar
                appsDropdown={AppsDropdown}
                logo={Logo}
                userDropdown={HomepageSidebarUserDropdown}
                reportDescriptionContext={reportDescriptionContext}
              />
            }
            header={<HomepageHeader headerActions={HomepageHeaderActions} />}
            drawerApp={<DrawerApp customAppSettings={<DocsQuickSettings />} />}
          >
            {children}
          </HomepageLayout>
        </SidebarStateProvider>
      </HomepageStyleScope>
    </div>
  )
}
