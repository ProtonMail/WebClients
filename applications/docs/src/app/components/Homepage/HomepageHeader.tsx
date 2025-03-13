import type { ReactNode } from 'react'
import { c } from 'ttag'
import { PrivateHeader, UserDropdown, useActiveBreakpoint } from '@proton/components'
import { APPS } from '@proton/shared/lib/constants'
import { HomepageSearch } from './HomepageSearch'

interface Props {
  isHeaderExpanded: boolean
  toggleHeaderExpanded: () => void
  searchBox?: ReactNode
  title?: string
  settingsButton?: ReactNode
  onSearchTextChange: (searchText: string) => void
}

export const HomepageHeader = ({
  onSearchTextChange,
  isHeaderExpanded,
  toggleHeaderExpanded,
  title = c('Title').t`Docs`,
}: Props) => {
  const { viewportWidth } = useActiveBreakpoint()

  return (
    <div className="homepage-header items-center justify-center">
      <PrivateHeader
        app={APPS.PROTONDRIVE}
        userDropdown={<UserDropdown app={APPS.PROTONDOCS} />}
        title={title}
        expanded={isHeaderExpanded}
        onToggleExpand={toggleHeaderExpanded}
        isSmallViewport={viewportWidth['<=small']}
        actionArea={<HomepageSearch onSearchTextChange={onSearchTextChange} />}
      />
    </div>
  )
}
