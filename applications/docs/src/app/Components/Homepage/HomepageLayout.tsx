import { type ReactNode } from 'react'

import { DrawerApp, PrivateAppContainer, PrivateMainArea, TopBanners, useToggle } from '@proton/components'
import { APPS } from '@proton/shared/lib/constants'

import DocsQuickSettings from '../layout/DocsQuickSettings'
import type { DocumentAction } from '@proton/drive-store'
import { HomepageHeader } from './HomepageHeader'
import { HomepageSidebar } from './HomepageSidebar'
import './HomepageLayout.scss'

interface Props {
  children: ReactNode
  action?: DocumentAction['mode']
  onSearchTextChange: (searchText: string) => void
}

export const HomepageLayout = ({ children, onSearchTextChange }: Props) => {
  const { state: expanded, toggle: toggleExpanded } = useToggle()
  return (
    <PrivateAppContainer
      top={<TopBanners app={APPS.PROTONDOCS} />}
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
