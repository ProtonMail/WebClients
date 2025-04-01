import { ButtonLike, CircleLoader } from '@proton/atoms'
import type { TableVariant } from './DocumentsTable'
import { DocumentsTable } from './DocumentsTable'
import { InvitesTable } from './InvitesTable'
import { ContextMenuProvider } from './DocContextMenu/context'
import emptyStateImage from './empty-state.svg'
import { getAppHref } from '@proton/shared/lib/apps/helper'
import { APPS } from '@proton/shared/lib/constants'
import { Icon, useAuthentication } from '@proton/components'
import { c } from 'ttag'
import { useHomepageView } from '../../__utils/homepage-view'
import { useEffect } from 'react'
import { ContentSheet } from './shared'

export function HomepageContent() {
  return (
    <ContextMenuProvider>
      <PreloadImages urls={[emptyStateImage]} />
      <div className="flex h-full w-full flex-col flex-nowrap gap-5 small:pr-2">{useRenderHomepageView()}</div>
    </ContextMenuProvider>
  )
}

function useRenderHomepageView(): JSX.Element | null {
  const { state } = useHomepageView()

  switch (state.view) {
    // Initial.
    case 'search-initial':
    case 'recents-initial':
      // These cases happen when recent document fetching has not started yet.
      // The reason to not render anything is to avoid flashing a loading spinner,
      // which can happen in some cases if the page renders before the cache is loaded.
      return null
    // Loading.
    case 'search-loading':
    case 'recents-loading':
    case 'favorites-loading':
    case 'trashed-loading':
      return (
        <div className="flex h-full items-center justify-center">
          <CircleLoader size="large" />
        </div>
      )
    // Empty states.
    case 'search-empty':
      return <EmptyState variant="search" />
    case 'recents-empty':
      return (
        <>
          <InvitesTable />
          <EmptyState variant="recents" />
        </>
      )
    case 'favorites-empty':
      // TODO: implement favorites
      return null
    case 'trashed-empty':
      return <EmptyState variant="trashed" />
    // Document lists.
    case 'search':
      return <DocumentsTable itemsSections={state.itemSections} variant="search" />
    case 'recents':
      let variant: TableVariant
      switch (state.sort) {
        case 'viewed':
          variant = 'recents-viewed'
          break
        case 'modified':
          variant = 'recents-modified'
          break
        case 'name':
          variant = 'recents-name'
          break
      }
      return (
        <>
          <InvitesTable />
          <DocumentsTable itemsSections={state.itemSections} variant={variant} />
        </>
      )
    case 'favorites':
      // TODO: implement favorites
      return null
    case 'trashed':
      return <DocumentsTable itemsSections={state.itemSections} variant="trashed" />
    // This won't happen, it's only here for type safety.
    case 'unknown':
      return null
    // TODO: what about error states?
  }
}

type EmptyStateVariant = 'recents' | 'trashed' | 'search'

type EmptyStateProps = { variant: EmptyStateVariant }
function getEmptyStateText(variant: EmptyStateVariant): string {
  switch (variant) {
    case 'recents':
      return c('Info').t`Create an encrypted document.`
    case 'trashed':
      return c('Info').t`There are no documents in the trash.`
    case 'search':
      return c('Info').t`No recent documents match your search.`
  }
}

// TODO: implement all variants
function EmptyState({ variant }: EmptyStateProps) {
  const { getLocalID } = useAuthentication()

  return (
    <ContentSheet isBottom className="flex grow items-center justify-center">
      <div className="flex flex-col items-center gap-8 py-8">
        <img
          className="w-custom"
          style={{ '--w-custom': '130px' }}
          src={emptyStateImage}
          alt={c('Info').t`No recent documents`}
        />
        <div className="w-custom text-center" style={{ '--w-custom': '400px' }}>
          <span className="text-bold text-2xl">{getEmptyStateText(variant)}</span>
        </div>
        <div className="flex justify-center">
          {variant === 'recents' ? (
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
              {c('Action').t`New document`}
            </ButtonLike>
          ) : null}
        </div>
      </div>
    </ContentSheet>
  )
}

type PreloadImagesProps = { urls: string[] }

/**
 * Preloads images. This prevents flashing of empty state images.
 */
function PreloadImages({ urls }: PreloadImagesProps) {
  useEffect(() => {
    const links = urls.map((url) => {
      const link = document.createElement('link')
      link.rel = 'preload'
      link.as = 'image'
      link.href = url
      document.head.appendChild(link)
      return link
    })

    return () => links.forEach((link) => link.remove())
  }, [urls])

  return null
}
