import { CircleLoader } from '@proton/atoms/CircleLoader/CircleLoader'
import type { TableVariant } from './DocumentsTable'
import { DocumentsTable } from './DocumentsTable'
import { InvitesTable } from './InvitesTable'
import { ContextMenuProvider } from './DocContextMenu/context'
import { Icon } from '@proton/components'
import { c } from 'ttag'
import { useHomepageView } from '../../__utils/homepage-view'
import { useEffect } from 'react'
import { ContentSheet } from './shared'
import emptyStateRecentsImage from './empty-state-recents.svg'
import emptyStateImage from './empty-state.svg'
import clsx from '@proton/utils/clsx'
import * as Ariakit from '@ariakit/react'
import { NewDocumentMenu } from './NewDocumentMenu'

export function HomepageContent() {
  return (
    <ContextMenuProvider>
      <PreloadImages urls={[emptyStateImage, emptyStateRecentsImage]} />
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
    case 'trash-loading':
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
    case 'trash-empty':
      return <EmptyState variant="trash" />
    // Document lists.
    case 'search':
      return <DocumentsTable itemsSections={state.itemSections} variant="search" />
    case 'recents':
      let variant: TableVariant
      switch (state.sort) {
        case 'viewed':
          variant = 'recents-viewed'
          break
        // case 'modified':
        //   variant = 'recents-modified'
        //   break
        case 'name':
          variant = 'recents-name'
          break
        case 'owner':
          variant = 'recents-owner'
          break
        case 'location':
          variant = 'recents-location'
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
    case 'trash':
      return <DocumentsTable itemsSections={state.itemSections} variant="trash" />
    // This won't happen, it's only here for type safety.
    case 'unknown':
      return null
    // TODO: what about error states?
  }
}

type EmptyStateVariant = 'recents' | 'trash' | 'search'

type EmptyStateProps = { variant: EmptyStateVariant }
function getEmptyStateText(variant: EmptyStateVariant): string {
  switch (variant) {
    case 'recents':
      return c('Info').t`Create an end-to-end encrypted document.`
    case 'trash':
      return c('Info').t`There are no documents in the trash.`
    case 'search':
      return c('Info').t`No recent documents match your search.`
  }
}

function EmptyState({ variant }: EmptyStateProps) {
  return (
    <ContentSheet isBottom className="flex shrink-0 grow items-center justify-center">
      <div className="flex flex-col items-center gap-6 p-8">
        <img
          className={clsx(variant === 'recents' ? 'w-[38.3125rem] scale-110 xsmall:scale-100' : 'w-[8.125rem]')}
          aria-hidden="true"
          src={variant === 'recents' ? emptyStateRecentsImage : emptyStateImage}
          alt="Empty state illustration"
        />
        <p className="text-bold m-0 mb-1 max-w-[25rem] text-center text-2xl">{getEmptyStateText(variant)}</p>
        <div className="flex justify-center">
          {variant === 'recents' ? (
            <Ariakit.MenuProvider placement="top">
              <Ariakit.MenuButton className="flex items-center justify-center gap-2 rounded-[0.5rem] !bg-[--docs-blue-color] px-4 py-2.5 text-[#fff]">
                <Icon name="plus" />
                New
              </Ariakit.MenuButton>
              <NewDocumentMenu />
            </Ariakit.MenuProvider>
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
