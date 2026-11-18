import { useMemo, useState, type ComponentType, type ReactNode } from 'react'
import { useHistory, useRouteMatch } from 'react-router'
import { c } from 'ttag'

import { IcMagnifier } from '@proton/icons/icons/IcMagnifier'

import { Input } from './components/atoms'
import { IconButton } from './components/ui'
import { HOMEPAGE_RECENTS_PATH } from './homepage-paths'
import { useHomepageView } from './homepageViewContext'
import { useSidebarState } from './sidebarState'
import { APPS } from './utils/apps'
import { clsx } from './utils/clsx'
import { useEvent } from './utils/useEvent'
import { useIsNarrow } from './utils/useIsNarrow'
import type { ProtonDocumentType } from './utils/mimetype'

const USER_DROPDOWN_OVERRIDES =
  '[&_.user-dropdown-displayName]:font-[0.8571428571em] [&_.user-dropdown-displayName]:leading-[1.2] [&_.user-initials]:!leading-[1.0714rem]'

export type HomepageHeaderComponentProps = {
  className?: string
  app: (typeof APPS)[keyof typeof APPS]
  userDropdown: ReactNode
  title: string
  expanded: boolean
  onToggleExpand: () => void
  isSmallViewport: boolean
  actionArea: ReactNode
}

export type HomepageUserDropdownComponentProps = {
  app: (typeof APPS)[keyof typeof APPS]
  reportDescriptionContext: string[]
}

export type HomepageHeaderProps = {
  protonHeader: ComponentType<HomepageHeaderComponentProps>
  userDropdown: (props: HomepageUserDropdownComponentProps) => ReactNode
  reportDescriptionContext: string[]
}

export function HomepageHeader({
  protonHeader: ProtonHeader,
  userDropdown: UserDropdown,
  reportDescriptionContext,
}: HomepageHeaderProps) {
  const { expanded, toggleExpanded } = useSidebarState()
  const isNarrow = useIsNarrow()
  const { state, type, setSearch } = useHomepageView()
  // Every search view has the query, also while the recents load: the field must keep what's typed meanwhile.
  const searchValue = 'query' in state ? state.query : undefined

  return (
    <div className="homepage-header shrink-0 items-center justify-center small:pe-[.625rem]">
      <ProtonHeader
        className={clsx('flex items-center small:!px-0', USER_DROPDOWN_OVERRIDES)}
        app={APPS.PROTONDRIVE}
        userDropdown={<UserDropdown app={APPS.PROTONDOCS} reportDescriptionContext={reportDescriptionContext} />}
        title={c('Title').t`Docs`}
        expanded={expanded}
        onToggleExpand={toggleExpanded}
        isSmallViewport={isNarrow}
        actionArea={
          <>
            <MobileSearch
              className="mobile-search-hack small:!hidden"
              value={searchValue}
              onChange={(value) => setSearch(value, false)}
              type={type}
            />
            <Search
              className="!hidden ps-1 small:!flex"
              value={searchValue}
              onChange={(value) => setSearch(value, false)}
              type={type}
            />
          </>
        }
      />
    </div>
  )
}

type SearchProps = {
  value: string | undefined
  onChange: (value: string | undefined) => void
  type: ProtonDocumentType | undefined
  className?: string
}

function Search({ value, onChange, type, className }: SearchProps) {
  const isRecentsRoute = useRouteMatch(HOMEPAGE_RECENTS_PATH)
  const history = useHistory()
  const handleChange = useEvent((value: string | undefined) => {
    // Ensure that the user is redirected to the recents page when searching.
    if (value && value.length > 0 && !isRecentsRoute) {
      history.push('/recents')
    }
    onChange(value)
  })
  const placeholder = useMemo(() => {
    if (type) {
      switch (type) {
        case 'document':
          return c('Action').t`Search recent documents`
        case 'spreadsheet':
          return c('Action').t`Search recent spreadsheets`
      }
    }
    return c('Action').t`Search recents`
  }, [type])
  return (
    <div className={className}>
      <Input
        className="w-[clamp(21.25rem,100vw*.35-1.25rem,32.5rem)] border-[--border-weak] focus-within:!border-[#bcb9b6] hover:!border-[#bcb9b6] [[data-theme-mode=dark]_&]:!border-[--background-weak] [[data-theme-mode=dark]_&]:!bg-[--background-weak] [[data-theme-mode=dark]_&]:focus-within:!border-[--border-norm] [[data-theme-mode=dark]_&]:hover:!border-[--border-norm]"
        inputClassName="h-[32px] small:h-auto"
        onKeyDown={(event) => {
          if (event.key === 'Escape') {
            onChange(undefined)
          }
        }}
        prefix={
          <span>
            <IcMagnifier size={5} color="weak" alt={c('Action').t`Search`} />
          </span>
        }
        value={value ?? ''}
        onChange={(e) => handleChange(e.target.value)}
        placeholder={placeholder}
      />
    </div>
  )
}

function MobileSearch({ value, onChange, type, className }: SearchProps) {
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
  const placeholder = useMemo(() => {
    if (type) {
      switch (type) {
        case 'document':
          return c('Action').t`Search recent documents`
        case 'spreadsheet':
          return c('Action').t`Search recent spreadsheets`
      }
    }
    return c('Action').t`Search recents`
  }, [type])
  return (
    <div className={clsx('flex grow items-center gap-2', className)}>
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
          className="w-full max-w-[21.25rem] border-[--border-weak] focus-within:!border-[#bcb9b6] hover:!border-[#bcb9b6] [[data-theme-mode=dark]_&]:!border-[--background-weak] [[data-theme-mode=dark]_&]:!bg-[--background-weak] [[data-theme-mode=dark]_&]:focus-within:!border-[--border-norm] [[data-theme-mode=dark]_&]:hover:!border-[--border-norm]"
          inputClassName="h-[32px] small:h-auto"
          prefix={
            <span>
              <IcMagnifier size={5} color="weak" alt={c('Action').t`Search`} />
            </span>
          }
          value={value ?? ''}
          onChange={(e) => handleChange(e.target.value)}
          placeholder={placeholder}
        />
      ) : (
        <>
          <div className="grow font-[.875rem] font-semibold">
            {isRecentsRoute ? c('Info').t`Recents` : c('Info').t`Trash`}
          </div>
          <IconButton label={placeholder} shape="outline" onClick={() => setActive(true)}>
            <IcMagnifier size={4} />
          </IconButton>
        </>
      )}
    </div>
  )
}
