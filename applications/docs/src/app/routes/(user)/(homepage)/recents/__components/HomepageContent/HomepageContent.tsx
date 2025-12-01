import { CircleLoader } from '@proton/atoms/CircleLoader/CircleLoader'
import type { TableVariant } from './DocumentsTable'
import { DocumentsTable } from './DocumentsTable'
import { InvitesTable } from './InvitesTable'
import { ContextMenuProvider } from './DocContextMenu/context'
import { Icon, useAuthentication } from '@proton/components'
import { c } from 'ttag'
import { useHomepageView } from '../../__utils/homepage-view'
import { forwardRef, useEffect } from 'react'
import { COLOR_BY_TYPE, ContentSheet, ICON_BY_TYPE } from './shared'
import emptyStateRecentsImage from './empty-state-recents.svg'
import emptyStateImage from './empty-state.svg'
import clsx from '@proton/utils/clsx'
import * as Ariakit from '@ariakit/react'
import { getAppHref } from '@proton/shared/lib/apps/helper'
import { APPS } from '@proton/shared/lib/constants'
import { useApplication } from '~/utils/application-context'
import { TelemetryDocsHomepageEvents } from '@proton/shared/lib/api/telemetry'
import { useIsSheetsEnabled } from '~/utils/misc'

export function HomepageContent() {
  return (
    <ContextMenuProvider>
      <PreloadImages urls={[emptyStateImage, emptyStateRecentsImage]} />
      <div className="flex h-full w-full flex-col flex-nowrap gap-5 small:pr-2">
        <HomepageView />
      </div>
    </ContextMenuProvider>
  )
}

function HomepageView(): JSX.Element | null {
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
    case 'recents': {
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
    }
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

type GetEmptyStateTextProps = {
  variant: EmptyStateVariant
  isSheetsEnabled: boolean
}
function getEmptyStateText(props: GetEmptyStateTextProps): string {
  const { variant, isSheetsEnabled } = props

  switch (variant) {
    case 'recents':
      return isSheetsEnabled
        ? c('Info').t`Create end-to-end encrypted documents and spreadsheets.`
        : c('Info').t`Create an end-to-end encrypted document.`
    case 'trash':
      return c('Info').t`There are no documents in the trash.`
    case 'search':
      return c('Info').t`No recent documents match your search.`
  }
}

const REFRESH_AFTER_NEW_DOCUMENT = 10000 // ms

const HomepageButton = forwardRef<HTMLButtonElement, Ariakit.ButtonProps>(function HomepageButton(props, ref) {
  return (
    <Ariakit.Button
      {...props}
      className={clsx(
        'inline-flex h-9 items-center justify-center gap-2 rounded pl-3 pr-4 text-sm no-underline',
        '!text-[--text-norm] hover:bg-[#C2C1C0]/20 hover:text-[--text-norm]',
        'border border-[#EAE7E4]',
        '!outline-none transition focus-visible:border-[#6D4AFF] focus-visible:ring-[3px] focus-visible:ring-[#6D4AFF33]',
        props.className,
      )}
      ref={ref}
    />
  )
})

function RecentsEmptyStateButtons() {
  const application = useApplication()
  const { getLocalID } = useAuthentication()
  const { updateRecentDocuments } = useHomepageView()
  const isSheetsEnabled = useIsSheetsEnabled()

  return (
    <div className="flex items-center justify-center gap-4">
      <HomepageButton
        render={<Ariakit.Role.a href={getAppHref('/doc', APPS.PROTONDOCS, getLocalID())} target="_blank" />}
        onClick={() => {
          application.metrics.reportHomepageTelemetry(TelemetryDocsHomepageEvents.document_created)
          setTimeout(updateRecentDocuments, REFRESH_AFTER_NEW_DOCUMENT)
        }}
      >
        <Icon
          name={ICON_BY_TYPE.document}
          size={4}
          className="shrink-0 text-[--icon-color]"
          style={{ '--icon-color': COLOR_BY_TYPE.document }}
        />
        {c('Action').t`New document`}
      </HomepageButton>

      {isSheetsEnabled ? (
        <HomepageButton
          className="relative"
          render={<Ariakit.Role.a href={getAppHref('/sheet', APPS.PROTONDOCS, getLocalID())} target="_blank" />}
        >
          <Icon
            name={ICON_BY_TYPE.spreadsheet}
            size={4}
            className="shrink-0 text-[--icon-color]"
            style={{ '--icon-color': COLOR_BY_TYPE.spreadsheet }}
          />
          {c('sheets_2025:Action').t`New spreadsheet`}
          <span
            className={clsx(
              'flex h-4 items-center justify-center rounded-full bg-[--background-weak] px-1.5',
              'text-[0.625rem]/[1rem] font-semibold text-[--link-norm]',
              'pointer-events-none absolute -right-5 -top-2',
            )}
          >{c('Info').t`New`}</span>
        </HomepageButton>
      ) : null}
    </div>
  )
}

type EmptyStateProps = { variant: EmptyStateVariant }
function EmptyState({ variant }: EmptyStateProps) {
  const isSheetsEnabled = useIsSheetsEnabled()

  return (
    <ContentSheet isBottom className="flex shrink-0 grow items-center justify-center">
      <div className="flex flex-col items-center gap-6 p-8">
        <img
          className={clsx(variant === 'recents' ? 'w-[38.3125rem] scale-110 xsmall:scale-100' : 'w-[8.125rem]')}
          aria-hidden="true"
          src={variant === 'recents' ? emptyStateRecentsImage : emptyStateImage}
          alt="Empty state illustration"
        />
        <p className="text-bold m-0 mb-1 max-w-[25rem] text-center text-2xl">
          {getEmptyStateText({ variant, isSheetsEnabled })}
        </p>
        {variant === 'recents' ? <RecentsEmptyStateButtons /> : null}
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

    return () => {
      for (const link of links) {
        link.remove()
      }
    }
  }, [urls])

  return null
}
