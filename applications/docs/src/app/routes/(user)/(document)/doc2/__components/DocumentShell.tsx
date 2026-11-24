import type { ReactNode } from 'react'

import { inertProps } from '@proton/atoms/helpers/inertProps'
import DrawerApp from '@proton/components/components/drawer/DrawerApp'
import PrivateAppContainer from '@proton/components/containers/app/PrivateAppContainer'
import PrivateMainArea from '@proton/components/containers/layout/PrivateMainArea'
import PasswordReminderTopBanner from '@proton/account-recovery/passwordReminder/PasswordReminderTopBanner'
import TopBanners from '@proton/components/containers/topBanners/TopBanners'
import { APPS } from '@proton/shared/lib/constants'

import { DocsQuickSettings } from '~/components/DocsQuickSettings'
import { isRunningInNativeMobileWeb } from '../__utils/isRunningInNativeMobileWeb'

export type DocumentShellProps = {
  header: ReactNode
  children?: ReactNode
  /** Covers the whole page, banners and header included, while given */
  loadingScreen?: ReactNode
  /** A share link's page: no banners and no drawer, as /doc shows a public visitor */
  isPublic?: boolean
}

/**
 * Adapted from `applications/docs/src/app/components/document/DocumentLayout/DocumentLayout.tsx`, /doc's app shell:
 * the banners, `header`, and the drawer with the quick settings, the banners and drawer for a member only. The native
 * app's webview shows no header.
 * Under `loadingScreen` the page stays mounted and laid out, never hidden, so it loads under the screen and nothing
 * moves when the screen lifts; it is busy and inert, so nothing under the screen takes focus or clicks.
 */
export function DocumentShell({ header, children, loadingScreen, isPublic }: DocumentShellProps) {
  const loading = Boolean(loadingScreen)

  return (
    <>
      {/* One element whether loading or not, so the screen lifting remounts nothing, the editor frame least of all */}
      <div className="h-full" aria-busy={loading || undefined} {...inertProps(loading)}>
        <PrivateAppContainer
          top={
            isPublic ? null : (
              <TopBanners app={APPS.PROTONDOCS}>
                <PasswordReminderTopBanner />
              </TopBanners>
            )
          }
          header={isRunningInNativeMobileWeb() ? null : header}
          sidebar={null}
          drawerApp={isPublic ? null : <DrawerApp customAppSettings={<DocsQuickSettings />} />}
        >
          <PrivateMainArea hasToolbar className="[&>div]:h-full">
            {children}
          </PrivateMainArea>
        </PrivateAppContainer>
      </div>
      {loadingScreen}
    </>
  )
}
