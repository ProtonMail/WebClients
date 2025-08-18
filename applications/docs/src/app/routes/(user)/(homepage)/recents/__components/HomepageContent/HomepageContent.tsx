import { ButtonLike, CircleLoader } from '@proton/atoms'
import type { TableVariant } from './DocumentsTable'
import { DocumentsTable } from './DocumentsTable'
import { InvitesTable } from './InvitesTable'
import { ContextMenuProvider } from './DocContextMenu/context'
import { getAppHref } from '@proton/shared/lib/apps/helper'
import { APPS } from '@proton/shared/lib/constants'
import { Icon, useAuthentication } from '@proton/components'
import { c } from 'ttag'
import { useHomepageView } from '../../__utils/homepage-view'
import { useEffect } from 'react'
import { ContentSheet } from './shared'
import { useIsSheetsEnabled } from '~/utils/misc'
import emptyStateRecentsImage from './empty-state-recents.svg'
import emptyStateImage from './empty-state.svg'
import clsx from '@proton/utils/clsx'
import { useApplication } from '~/utils/application-context'
import { TelemetryDocsHomepageEvents } from '@proton/shared/lib/api/telemetry'

const REFRESH_AFTER_NEW_DOCUMENT = 10000 // ms

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
  const application = useApplication()
  const { getLocalID } = useAuthentication()
  const isSheetsEnabled = useIsSheetsEnabled()
  const { updateRecentDocuments } = useHomepageView()

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
            <ButtonLike
              as="a"
              href={getAppHref('/doc', APPS.PROTONDOCS, getLocalID())}
              target="_blank"
              color="norm"
              size="large"
              shape="solid"
              onClick={() => {
                application.metrics.reportHomepageTelemetry(TelemetryDocsHomepageEvents.document_created)
                setTimeout(updateRecentDocuments, REFRESH_AFTER_NEW_DOCUMENT)
              }}
              style={{ backgroundColor: 'var(--docs-blue-color)' }}
              className="flex items-center justify-center gap-2"
            >
              <Icon name="brand-proton-docs" />
              {c('Action').t`New document`}
            </ButtonLike>
          ) : null}
        </div>
        {variant === 'recents' && isSheetsEnabled ? (
          <div className="flex justify-center">
            <ButtonLike
              as="a"
              href={getAppHref('/sheet', APPS.PROTONDOCS, getLocalID())}
              target="_blank"
              color="norm"
              size="large"
              shape="solid"
              style={{ backgroundColor: 'var(--docs-blue-color)' }}
              className="flex items-center justify-center gap-2"
            >
              <Icon name="plus" />
              {c('sheets_2025:Action').t`New spreadsheet`}
            </ButtonLike>
          </div>
        ) : null}
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
