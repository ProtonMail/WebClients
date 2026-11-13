import type { ReactNode } from 'react'

import DrawerApp from '@proton/components/components/drawer/DrawerApp'
import PrivateAppContainer from '@proton/components/containers/app/PrivateAppContainer'
import PrivateMainArea from '@proton/components/containers/layout/PrivateMainArea'
import TopBanners from '@proton/components/containers/topBanners/TopBanners'
import { APPS } from '@proton/shared/lib/constants'

import { DocsQuickSettings } from '~/components/DocsQuickSettings'
import { isRunningInNativeMobileWeb } from '../__utils/isRunningInNativeMobileWeb'

export type DocumentShellProps = { header: ReactNode; children: ReactNode }

/**
 * Adapted from `applications/docs/src/app/components/document/DocumentLayout/DocumentLayout.tsx`, /doc's app shell:
 * the banners, `header`, and the drawer with the quick settings. The native app's webview shows no header.
 */
export function DocumentShell({ header, children }: DocumentShellProps) {
  return (
    <PrivateAppContainer
      top={<TopBanners app={APPS.PROTONDOCS} />}
      header={isRunningInNativeMobileWeb() ? null : header}
      sidebar={null}
      drawerApp={<DrawerApp customAppSettings={<DocsQuickSettings />} />}
    >
      <PrivateMainArea hasToolbar className="[&>div]:h-full">
        {children}
      </PrivateMainArea>
    </PrivateAppContainer>
  )
}
