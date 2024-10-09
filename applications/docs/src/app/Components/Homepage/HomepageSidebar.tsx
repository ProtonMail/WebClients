import { c } from 'ttag'
import { ButtonLike } from '@proton/atoms'
import {
  Icon,
  Logo,
  Sidebar,
  SidebarList,
  SidebarListItem,
  SidebarListItemLink,
  SidebarNav,
  AppsDropdown,
  useAuthentication,
} from '@proton/components'
import { getAppHref } from '@proton/shared/lib/apps/helper'
import { APPS } from '@proton/shared/lib/constants'

export const HomepageSidebar = ({ expanded, onToggle }: { expanded: boolean; onToggle: () => void }) => {
  const { getLocalID } = useAuthentication()
  return (
    <Sidebar
      className="ui-standard homepage-wrapper"
      expanded={expanded}
      onToggleExpand={onToggle}
      app="proton-docs"
      appsDropdown={<AppsDropdown app={APPS.PROTONDOCS} />}
      logo={<Logo appName={APPS.PROTONDOCS} />}
      primary={
        <ButtonLike
          as="a"
          href={getAppHref('/doc', APPS.PROTONDOCS, getLocalID())}
          target="_blank"
          color="norm"
          size="large"
          shape="solid"
          style={{ backgroundColor: 'var(--docs-blue-color)' }}
          className="flex items-center justify-center gap-2"
        >
          <Icon name="plus" />
          {c('Action').t`New`}
        </ButtonLike>
      }
    >
      <SidebarNav>
        <SidebarList>
          <SidebarListItem>
            <SidebarListItemLink
              to="/most-recent"
              exact={true}
              className="hover flex items-center gap-2"
              activeClassName="text-bold "
            >
              <Icon name="house" /> Most recent
            </SidebarListItemLink>
          </SidebarListItem>
          <SidebarListItem>
            <SidebarListItemLink
              to="/owned-by-me"
              className="hover flex items-center gap-2"
              activeClassName="text-bold "
            >
              <Icon name="user" /> Owned by me
            </SidebarListItemLink>
          </SidebarListItem>
          <SidebarListItem>
            <SidebarListItemLink
              to="/owned-by-others"
              className="hover flex items-center gap-2"
              activeClassName="text-bold "
            >
              <Icon name="users" /> Owned by others
            </SidebarListItemLink>
          </SidebarListItem>
        </SidebarList>
      </SidebarNav>
    </Sidebar>
  )
}
