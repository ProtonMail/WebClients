import { useEffect, useRef, type ReactNode } from 'react'
import { ButtonLike, CircleLoader } from '@proton/atoms'
import { RecentDocumentsTable } from './RecentDocumentsTable'
import { useRecentDocuments } from '../../__utils/recent-documents'
import { InvitesTable } from './InvitesTable'
import { ContextMenuProvider } from './DocContextMenu/context'
import emptyStateImage from './empty-state.svg'
import { getAppHref } from '@proton/shared/lib/apps/helper'
import { APPS } from '@proton/shared/lib/constants'
import { Icon, useAuthentication } from '@proton/components'
import { c } from 'ttag'
import { useApplication } from '~/utils/application-context'

export function HomepageContent() {
  let children: ReactNode

  const { logger } = useApplication()

  const { state, items } = useRecentDocuments()

  const startTimeRef = useRef<number | null>(null)

  useEffect(() => {
    if (state === 'resolving') {
      startTimeRef.current = Date.now()
    } else if (state === 'done' && startTimeRef.current) {
      const duration = (Date.now() - startTimeRef.current) / 1000
      logger.debug(`Time to render ${items.length} recent documents: ${duration.toFixed(2)}s`)
      startTimeRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state, logger])

  if (items.length > 0) {
    children = <RecentDocumentsTable />
  } else if (state === 'not_fetched') {
    children = null
  } else if (state === 'fetching' || (state === 'resolving' && items.length === 0)) {
    children = (
      <div className="flex h-full items-center justify-center">
        <CircleLoader size="large" />
      </div>
    )
  } else if (items.length === 0 && state === 'done') {
    children = <EmptyState />
  } else {
    children = <RecentDocumentsTable />
  }

  return (
    <ContextMenuProvider>
      <div className="flex h-full w-full flex-col px-2 pt-2">
        <InvitesTable className="mb-5" />
        <div className="bg-norm border-weak flex w-full flex-1 flex-col overflow-auto rounded-t-xl border">
          {children}
        </div>
      </div>
    </ContextMenuProvider>
  )
}

function EmptyState() {
  const { getLocalID } = useAuthentication()

  return (
    <div className="flex h-full items-center justify-center">
      <div className="flex-column flex items-center gap-8 py-8">
        <img
          className="w-custom"
          style={{ '--w-custom': '130px' }}
          src={emptyStateImage}
          alt={c('Info').t`No recent documents`}
        />
        <div className="w-custom text-center" style={{ '--w-custom': '400px' }}>
          <span className="text-bold text-2xl">{c('Info').t`Create your end-to-end encrypted document`}</span>
        </div>
        <div className="flex justify-center">
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
        </div>
      </div>
    </div>
  )
}
