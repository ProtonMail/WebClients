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
} from '@proton/components'
import { APPS } from '@proton/shared/lib/constants'

export const HomepageSidebar = ({ expanded, onToggle }: { expanded: boolean; onToggle: () => void }) => {
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
          href="/doc"
          size="large"
          shape="outline"
          color="norm"
          className="w-full"
          style={{
            color: 'var(--docs-blue-color)',
            borderColor: 'var(--docs-blue-color)',
            backgroundColor: 'color-mix(in srgb, var(--docs-blue-color), transparent 90%)',
          }}
          target="_blank"
        >
          New document
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
