import { useState, type ReactNode } from 'react'

import {
  AppsDropdown,
  AppVersion,
  DrawerApp,
  getAppVersion,
  Icon,
  Logo,
  NOTIFICATION_DEFAULT_EXPIRATION_TIME,
  PrivateAppContainer,
  PrivateHeader,
  PrivateMainArea,
  Sidebar as ProtonSidebar,
  SidebarList,
  SidebarListItem,
  SidebarListItemDiv,
  SidebarListItemLink,
  SidebarNav,
  Tooltip,
  TopBanners,
  useActiveBreakpoint,
  useAppTitle,
  useAuthentication,
  useConfig,
  useNotifications,
  UserDropdown,
  useToggle,
} from '@proton/components'
import { APPS, DRIVE_APP_NAME } from '@proton/shared/lib/constants'

import { DocsQuickSettings } from '~/components/DocsQuickSettings'
import type { DocumentAction } from '@proton/drive-store'
import { c } from 'ttag'
import { Button, ButtonLike, Input } from '@proton/atoms'
import { getAppHref } from '@proton/shared/lib/apps/helper'
import './HomepageLayout.css'
import type { HomepageViewState } from '../__utils/homepage-view'
import { useHomepageView } from '../__utils/homepage-view'
import { useHistory, useRouteMatch } from 'react-router'
import { HOMEPAGE_RECENTS_PATH } from '../../../__components/AppContainer'
import { useEvent } from '~/utils/misc'
import clsx from '@proton/utils/clsx'
import { IS_REFRESH_ENABLED, IS_FAVORITES_ENABLED } from '../__utils/features'

const USER_DROPDOWN_OVERRIDES =
  '[&_.user-dropdown-displayName]:font-[0.8571428571em] [&_.user-dropdown-displayName]:leading-[1.2]'

// layout
// ------

export type HomepageLayoutProps = {
  children: ReactNode
  action?: DocumentAction['mode']
}

export function HomepageLayout({ children }: HomepageLayoutProps) {
  const { state: expanded, toggle: toggleExpanded, set: setExpanded } = useToggle()
  usePageTitle()
  return (
    <PrivateAppContainer
      containerRef={(el) => el?.classList.add('is-homepage')}
      top={<TopBanners app={APPS.PROTONDOCS} />}
      header={<Header toggleHeaderExpanded={toggleExpanded} isHeaderExpanded={expanded} />}
      sidebar={<Sidebar expanded={expanded} onToggle={toggleExpanded} setExpanded={setExpanded} />}
      drawerApp={<DrawerApp customAppSettings={<DocsQuickSettings />} />}
    >
      <PrivateMainArea className="!border-t-0 ps-1 [&>div]:[block-size:100%]" hasToolbar>
        {children}
      </PrivateMainArea>
    </PrivateAppContainer>
  )
}

// header
// ------

type HeaderProps = {
  isHeaderExpanded: boolean
  toggleHeaderExpanded: () => void
}

function Header({ isHeaderExpanded, toggleHeaderExpanded }: HeaderProps) {
  const { viewportWidth } = useActiveBreakpoint()
  const { state, setSearch } = useHomepageView()
  const searchValue = state.view === 'search' || state.view === 'search-empty' ? state.query : undefined

  return (
    <div className="homepage-header shrink-0 items-center justify-center small:pe-8">
      <PrivateHeader
        className={clsx('flex items-center !pe-0 !ps-2 small:!px-0', USER_DROPDOWN_OVERRIDES)}
        app={APPS.PROTONDRIVE}
        userDropdown={<UserDropdown app={APPS.PROTONDOCS} />}
        title={c('Title').t`Docs`}
        expanded={isHeaderExpanded}
        onToggleExpand={toggleHeaderExpanded}
        isSmallViewport={viewportWidth['<=small']}
        actionArea={
          <>
            <MobileSearch className="small:!hidden" value={searchValue} onChange={(value) => setSearch(value, true)} />
            <Search
              className="!hidden ps-1 small:!block"
              value={searchValue}
              onChange={(value) => setSearch(value, true)}
            />
          </>
        }
      />
    </div>
  )
}

// search
// ------

type SearchProps = { value: string | undefined; onChange: (value: string | undefined) => void; className?: string }

function Search({ value, onChange, className }: SearchProps) {
  const isRecentsRoute = useRouteMatch(HOMEPAGE_RECENTS_PATH)
  const history = useHistory()
  const handleChange = useEvent((value: string | undefined) => {
    // Ensure that the user is redirected to the recents page when searching.
    if (value && value.length > 0 && !isRecentsRoute) {
      history.push('/recents')
    }
    onChange(value)
  })
  return (
    <div className={className}>
      <Input
        className="border-weak max-w-[30.625rem] focus-within:!border-[#bcb9b6] hover:!border-[#bcb9b6]"
        inputClassName="h-[32px] small:h-auto"
        onKeyDown={(event) => {
          if (event.key === 'Escape') {
            onChange(undefined)
          }
        }}
        prefix={
          <span>
            <Icon size={5} color="weak" name="magnifier" alt={c('Action').t`Search`} />
          </span>
        }
        value={value ?? ''}
        onChange={(e) => handleChange(e.target.value)}
        placeholder={c('Action').t`Search recent documents`}
      />
    </div>
  )
}

function MobileSearch({ value, onChange, className }: SearchProps) {
  const isRecentsRoute = useRouteMatch(HOMEPAGE_RECENTS_PATH)
  const history = useHistory()
  const handleChange = useEvent((value: string | undefined) => {
    // Ensure that the user is redirected to the recents page when searching.
    if (value && value.length > 0 && !isRecentsRoute) {
      history.push('/recents')
    }
    onChange(value)
  })
  const [isActive, setActive] = useState(false)
  const isInput = (value && value.length > 0) || isActive
  return (
    <div className={clsx('flex items-center gap-2', className)}>
      {isInput ? (
        <Input
          ref={(element) => {
            if (isActive) {
              element?.focus()
            }
          }}
          onFocus={() => setActive(true)}
          onBlur={() => setActive(false)}
          onKeyDown={(event) => {
            if (event.key === 'Escape') {
              onChange(undefined)
            }
          }}
          className="border-weak w-full focus-within:!border-[#bcb9b6] hover:!border-[#bcb9b6]"
          inputClassName="h-[32px] small:h-auto"
          prefix={
            <span>
              <Icon size={5} color="weak" name="magnifier" alt={c('Action').t`Search`} />
            </span>
          }
          value={value ?? ''}
          onChange={(e) => handleChange(e.target.value)}
          placeholder={c('Action').t`Search recent documents`}
        />
      ) : (
        <>
          <div className="grow font-[.875rem] font-semibold">
            {isRecentsRoute ? c('Info').t`Recents` : c('Info').t`Trash`}
          </div>
          <Tooltip title={c('Action').t`Search recent documents`}>
            <Button size="medium" icon shape="outline" color="weak" onClick={() => setActive(true)}>
              <Icon name="magnifier" size={4} />
            </Button>
          </Tooltip>
        </>
      )}
    </div>
  )
}

// sidebar
// -------

type SidebarProps = { expanded: boolean; onToggle: () => void; setExpanded: (value: boolean) => void }

function Sidebar({ expanded, onToggle, setExpanded }: SidebarProps) {
  const { getLocalID } = useAuthentication()
  const isRecents = useRouteMatch(HOMEPAGE_RECENTS_PATH)
  const history = useHistory()
  const { updateRecentDocuments, isRecentsUpdating } = useHomepageView()
  const { createNotification } = useNotifications()
  const { APP_VERSION } = useConfig()
  const appVersion = getAppVersion(APP_VERSION)

  const newDocumentButton = (
    <ButtonLike
      as="a"
      href={getAppHref('/doc', APPS.PROTONDOCS, getLocalID())}
      target="_blank"
      color="norm"
      size="large"
      shape="solid"
      className="flex items-center justify-center gap-2 !bg-[--docs-blue-color] small:mx-[.375rem]"
    >
      {c('Action').t`New document`}
    </ButtonLike>
  )

  return (
    <ProtonSidebar
      app={APPS.PROTONDOCS}
      appsDropdown={<AppsDropdown app={APPS.PROTONDOCS} />}
      logo={<Logo appName={APPS.PROTONDOCS} />}
      expanded={expanded}
      onToggleExpand={onToggle}
      className={clsx(
        'ui-standard -me-1 !pt-3 small:!pt-0 [&_.logo-container]:!hidden small:[&_.logo-container]:!flex',
        USER_DROPDOWN_OVERRIDES,
      )}
      primary={newDocumentButton}
      version={<AppVersion appVersion={appVersion.split('+')[0]} fullVersion={appVersion} />}
    >
      <div className="px-3 pb-3 pt-2 small:hidden">{newDocumentButton}</div>
      <SidebarNav className="small:px-[.375rem]">
        <SidebarList>
          <SidebarListItem onClick={() => setExpanded(false)}>
            <SidebarListItemLink
              to="/recents"
              exact={true}
              data-updating={isRecentsUpdating ? '' : undefined}
              className="flex items-center justify-between"
              activeClassName="!font-semibold"
            >
              <span className="flex items-center gap-2">
                <Icon name="house" />
                <span>{c('Info').t`Recents`}</span>
              </span>
              {IS_REFRESH_ENABLED ? (
                <Tooltip title={c('Info').t`Update recent documents`}>
                  <Button
                    aria-label={c('Info').t`Update recent documents`}
                    icon
                    size="small"
                    shape="ghost"
                    className="-mr-1"
                    disabled={isRecentsUpdating}
                    onClick={async (e) => {
                      e.stopPropagation()
                      e.preventDefault()
                      if (!isRecents) {
                        history.push('/recents')
                      }
                      await updateRecentDocuments()
                      createNotification({
                        text: c('Notification').t`Recent documents updated`,
                        expiration: NOTIFICATION_DEFAULT_EXPIRATION_TIME,
                      })
                      setExpanded(false)
                    }}
                  >
                    <Icon
                      data-updating={isRecentsUpdating ? '' : undefined}
                      className="data-[updating]:animate-spin"
                      name="arrow-rotate-right"
                    />
                  </Button>
                </Tooltip>
              ) : null}
            </SidebarListItemLink>
          </SidebarListItem>
          {IS_FAVORITES_ENABLED && (
            <SidebarListItem onClick={() => setExpanded(false)}>
              <SidebarListItemLink to="/favorites" exact={true} activeClassName="!font-semibold">
                <span className="flex items-center gap-2">
                  <Icon name="star" />
                  <span>{c('Info').t`Favorites`}</span>
                </span>
              </SidebarListItemLink>
            </SidebarListItem>
          )}
          <SidebarListItem onClick={() => setExpanded(false)}>
            <SidebarListItemLink to="/trashed" exact={true} activeClassName="!font-semibold">
              <span className="flex items-center gap-2">
                <Icon name="trash" />
                <span>{c('Info').t`Trashed`}</span>
              </span>
            </SidebarListItemLink>
          </SidebarListItem>

          <SidebarListItem onClick={() => setExpanded(false)}>
            <a
              className="!text-[var(--sidebar-text-color,var(--text-norm))] no-underline"
              href={getAppHref('/', APPS.PROTONDRIVE, getLocalID())}
              target="_blank"
            >
              <SidebarListItemDiv className="flex items-center gap-2">
                <Icon name="brand-proton-drive" /> {c('Info').t`Go to ${DRIVE_APP_NAME}`}
              </SidebarListItemDiv>
            </a>
          </SidebarListItem>
        </SidebarList>
      </SidebarNav>
    </ProtonSidebar>
  )
}

// page title
// ----------

function usePageTitle() {
  const { state } = useHomepageView()
  useAppTitle(titleByViewState(state))
}

function titleByViewState(state: HomepageViewState): string {
  switch (state.view) {
    case 'search-initial':
    case 'search-loading':
    case 'search-empty':
    case 'search':
      return `${c('Page title').t`Searching`} "${state.query}"`
    case 'recents-initial':
    case 'recents-empty':
    case 'recents-loading':
    case 'recents':
      return c('Page title').t`Recents`
    case 'favorites-empty':
    case 'favorites-loading':
    case 'favorites':
      return c('Page title').t`Favorites`
    case 'trashed-loading':
    case 'trashed-empty':
    case 'trashed':
      return c('Page title').t`Trashed`
    case 'unknown':
      return ''
  }
}
