import type { ComponentType, ReactNode } from 'react'
import { useHistory, useRouteMatch } from 'react-router'
import type { NavLinkProps } from 'react-router-dom'
import { createSidebarMessages } from './messages/sidebar'
import * as Ariakit from '@ariakit/react'

import { IcArrowRotateRight } from '@proton/icons/icons/IcArrowRotateRight'
import { IcBrandProtonDrive } from '@proton/icons/icons/IcBrandProtonDrive'
import { IcHouse } from '@proton/icons/icons/IcHouse'
import { IcPlus } from '@proton/icons/icons/IcPlus'
import { IcTrash } from '@proton/icons/icons/IcTrash'
import { IcBrandProtonDocs } from '@proton/icons/icons/IcBrandProtonDocs'
import { IcBrandProtonSheets } from '@proton/icons/icons/IcBrandProtonSheets'

import { SidebarList, SidebarListItem, SidebarListItemDiv, SidebarNav } from './components/sidebar'
import { IconButton } from './components/ui'
import { HOMEPAGE_RECENTS_PATH } from './homepage-paths'
import { useHomepageView } from './homepageViewContext'
import { COLOR_BY_TYPE } from './HomepageContent/shared'
import { NewDocumentMenu } from './HomepageContent/NewDocumentMenu'
import { useSidebarState } from './sidebarState'
import { useReloadRecents } from './useReloadRecents'
import { APPS, DRIVE_APP_NAME } from './utils/apps'
import { clsx } from './utils/clsx'
import { TelemetryEvent } from './utils/telemetry'

const USER_DROPDOWN_OVERRIDES =
  '[&_.user-dropdown-displayName]:font-[0.8571428571em] [&_.user-dropdown-displayName]:leading-[1.2] [&_.user-initials]:!leading-[1.0714rem]'

export type HomepageAppsDropdownComponentProps = {
  app: (typeof APPS)[keyof typeof APPS]
}

export type HomepageAppVersionComponentProps = {
  appVersion: string
}

export type HomepageLogoComponentProps = {
  appName: (typeof APPS)[keyof typeof APPS]
}

export interface HomepageSidebarListItemLinkComponentProps extends Omit<NavLinkProps, 'className'> {
  children: ReactNode
  itemClassName?: string
  className?: string
  forceReload?: boolean
}

export type HomepageSidebarProps = {
  appsDropdown: (props: HomepageAppsDropdownComponentProps) => ReactNode
  appVersionComponent: (props: HomepageAppVersionComponentProps) => ReactNode
  logo: (props: HomepageLogoComponentProps) => ReactNode
  protonSidebar: ComponentType<HomepageSidebarComponentProps>
  sidebarListItemLink: ComponentType<HomepageSidebarListItemLinkComponentProps>
  /** The host's `APP_VERSION`. */
  appVersion: string
}

export type HomepageSidebarComponentProps = {
  app: (typeof APPS)[keyof typeof APPS]
  appsDropdown: ReactNode
  logo: ReactNode
  expanded: boolean
  onToggleExpand: () => void
  className: string
  primary: ReactNode
  version: ReactNode
  children: ReactNode
}

export function HomepageSidebar({
  appsDropdown,
  appVersionComponent,
  logo,
  protonSidebar,
  sidebarListItemLink,
  appVersion,
}: HomepageSidebarProps) {
  const { expanded, toggleExpanded, setExpanded } = useSidebarState()

  return (
    <Sidebar
      appsDropdown={appsDropdown}
      appVersionComponent={appVersionComponent}
      logo={logo}
      protonSidebar={protonSidebar}
      sidebarListItemLink={sidebarListItemLink}
      expanded={expanded}
      onToggle={toggleExpanded}
      setExpanded={setExpanded}
      appVersion={appVersion}
    />
  )
}

type SidebarProps = {
  appsDropdown: (props: HomepageAppsDropdownComponentProps) => ReactNode
  appVersionComponent: (props: HomepageAppVersionComponentProps) => ReactNode
  logo: (props: HomepageLogoComponentProps) => ReactNode
  protonSidebar: ComponentType<HomepageSidebarComponentProps>
  sidebarListItemLink: ComponentType<HomepageSidebarListItemLinkComponentProps>
  expanded: boolean
  onToggle: () => void
  setExpanded: (value: boolean) => void
  appVersion: string
}

function Sidebar({
  appsDropdown: AppsDropdown,
  appVersionComponent: AppVersion,
  logo: Logo,
  protonSidebar: ProtonSidebar,
  sidebarListItemLink: SidebarListItemLink,
  expanded,
  onToggle,
  setExpanded,
  appVersion,
}: SidebarProps) {
  const isRecents = useRouteMatch(HOMEPAGE_RECENTS_PATH)
  const history = useHistory()
  const { isRecentsUpdating, type, reportTelemetry, getAppHref } = useHomepageView()
  const messages = createSidebarMessages().sidebar
  const reloadRecents = useReloadRecents()
  const newDocumentButton = (
    <Ariakit.MenuProvider>
      <Ariakit.MenuButton className="flex w-full items-center justify-center gap-2 rounded-[0.5rem] !bg-[--docs-blue-color] px-4 py-2.5 text-[#fff]">
        <IcPlus />
        {messages.new}
      </Ariakit.MenuButton>
      <NewDocumentMenu sameWidth />
    </Ariakit.MenuProvider>
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
      version={<AppVersion appVersion={appVersion} />}
    >
      <div className="px-3 pb-3 pt-2 small:hidden">{newDocumentButton}</div>
      <SidebarNav>
        <div className="flex items-center justify-between px-3 py-2">
          <div className="px-3 !text-xs text-[#8F8D8A] [[data-theme-mode=dark]_&]:!text-[--text-weak]">
            {messages.recents}
          </div>
          <IconButton
            label={messages.updateRecentDocuments}
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
              await reloadRecents()
              setExpanded(false)
            }}
          >
            <IcArrowRotateRight
              data-updating={isRecentsUpdating ? '' : undefined}
              className="data-[updating]:animate-spin"
            />
          </IconButton>
        </div>
        <SidebarList>
          <SidebarListItem onClick={() => setExpanded(false)}>
            <SidebarListItemLink
              to={(location) => {
                const search = new URLSearchParams(location.search)
                search.delete('type')
                return { ...location, pathname: '/recents', search: search.toString() }
              }}
              exact={true}
              data-updating={isRecentsUpdating ? '' : undefined}
              className="flex items-center justify-between"
              activeClassName="!font-semibold"
              isActive={(match) => Boolean(match?.isExact && !type)}
            >
              <span className="flex items-center gap-2">
                <IcHouse />
                <span>{messages.all}</span>
              </span>
            </SidebarListItemLink>
          </SidebarListItem>
          <SidebarListItem onClick={() => setExpanded(false)}>
            <SidebarListItemLink
              to={(location) => {
                const search = new URLSearchParams(location.search)
                search.set('type', 'document')
                return { ...location, pathname: '/recents', search: search.toString() }
              }}
              exact={true}
              data-updating={isRecentsUpdating ? '' : undefined}
              className="flex items-center justify-between"
              activeClassName="!font-semibold"
              isActive={(match) => Boolean(match?.isExact && type === 'document')}
            >
              <span className="flex items-center gap-2">
                <IcBrandProtonDocs
                  className="shrink-0 text-[--icon-color]"
                  style={{ '--icon-color': COLOR_BY_TYPE.document }}
                />
                <span>{messages.documents}</span>
              </span>
            </SidebarListItemLink>
          </SidebarListItem>
          <SidebarListItem onClick={() => setExpanded(false)}>
            <SidebarListItemLink
              to={(location) => {
                const search = new URLSearchParams(location.search)
                search.set('type', 'spreadsheet')
                return { ...location, pathname: '/recents', search: search.toString() }
              }}
              exact={true}
              data-updating={isRecentsUpdating ? '' : undefined}
              className="flex items-center justify-between"
              activeClassName="!font-semibold"
              isActive={(match) => Boolean(match?.isExact && type === 'spreadsheet')}
            >
              <span className="flex items-center gap-2">
                <IcBrandProtonSheets
                  className="shrink-0 text-[--icon-color]"
                  style={{ '--icon-color': COLOR_BY_TYPE.spreadsheet }}
                />
                <span>{messages.spreadsheets}</span>
              </span>
            </SidebarListItemLink>
          </SidebarListItem>
          <li className="px-6">
            <hr className="my-3 h-px bg-[#EAE7E4] [[data-theme-mode=dark]_&]:!bg-[--border-norm]" />
          </li>

          <SidebarListItem onClick={() => setExpanded(false)}>
            <SidebarListItemLink to="/trash" exact={true} activeClassName="!font-semibold">
              <span className="flex items-center gap-2">
                <IcTrash />
                <span>{messages.trash}</span>
              </span>
            </SidebarListItemLink>
          </SidebarListItem>

          <SidebarListItem onClick={() => setExpanded(false)}>
            <a
              className="!text-[var(--sidebar-text-color,var(--text-norm))] no-underline"
              href={getAppHref('/', APPS.PROTONDRIVE)}
              target="_blank"
              onClick={() => {
                reportTelemetry(TelemetryEvent.drive_opened)
              }}
            >
              <SidebarListItemDiv className="flex items-center gap-2">
                <IcBrandProtonDrive /> {messages.goTo(DRIVE_APP_NAME)}
              </SidebarListItemDiv>
            </a>
          </SidebarListItem>
        </SidebarList>
      </SidebarNav>
    </ProtonSidebar>
  )
}
