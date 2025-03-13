import { type ReactNode } from 'react'

import { DrawerApp, PrivateAppContainer, PrivateMainArea, TopBanners, useToggle } from '@proton/components'
import { APPS } from '@proton/shared/lib/constants'

import { DocsQuickSettings } from '../DocsQuickSettings'
import type { DocumentAction } from '@proton/drive-store'
import { HomepageHeader } from './HomepageHeader'
import { HomepageSidebar } from './HomepageSidebar'

interface Props {
  children: ReactNode
  action?: DocumentAction['mode']
  onSearchTextChange: (searchText: string) => void
}

function InternalPageNotice() {
  return (
    <div aria-hidden className="bg-[red]/80 p-2 text-center text-[white]">
      <p className="m-0">
        This page is <b>internal</b>. It's a work in progress - expect missing, incomplete and broken features.
      </p>
    </div>
  )
}

export const HomepageLayout = ({ children, onSearchTextChange }: Props) => {
  const { state: expanded, toggle: toggleExpanded } = useToggle()
  return (
    <PrivateAppContainer
      top={
        <>
          <InternalPageNotice />
          <TopBanners app={APPS.PROTONDOCS} />
        </>
      }
      header={
        <HomepageHeader
          toggleHeaderExpanded={toggleExpanded}
          isHeaderExpanded={expanded}
          onSearchTextChange={onSearchTextChange}
        />
      }
      sidebar={<HomepageSidebar expanded={expanded} onToggle={toggleExpanded} />}
      drawerApp={<DrawerApp customAppSettings={<DocsQuickSettings />} />}
    >
      <PrivateMainArea hasToolbar>{children}</PrivateMainArea>
    </PrivateAppContainer>
  )
}

export default HomepageLayout
