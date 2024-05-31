import { memo } from 'react'

import { AppVersion, AppsDropdown, MainLogo, Sidebar, SidebarNav } from '@proton/components'
import { APPS } from '@proton/shared/lib/constants'

interface Props {
  expanded?: boolean
}

const DocsSidebar = ({ expanded = false }: Props) => {
  return (
    <>
      <Sidebar
        app={APPS.PROTONDOCS}
        expanded={expanded}
        appsDropdown={<AppsDropdown app={APPS.PROTONDOCS} />}
        logo={<MainLogo to="/" data-testid="main-logo" />}
        version={<AppVersion />}
        className="sidebar flex-column no-print flex flex-nowrap bg-[--background-strong] outline-none"
      >
        <SidebarNav className="flex">
          <div className="shrink-0"></div>
        </SidebarNav>
      </Sidebar>
    </>
  )
}

export default memo(DocsSidebar)
