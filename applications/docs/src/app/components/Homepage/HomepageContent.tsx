import { useEffect, useState, type ReactNode } from 'react'
import { CircleLoader } from '@proton/atoms'
import { HomepageNoItemsContent } from './HomepageNoItemsContent'
import { HomepageRecentDocumentsTable } from './HomepageRecentDocumentsTable'

import { useRecentDocuments } from './useRecentDocuments'
import { useApplication } from '../../Containers/ApplicationProvider'
import { InvitesTable } from './InvitesTable'

export function HomepageContent() {
  let children: ReactNode

  const { logger } = useApplication()

  const { status, items } = useRecentDocuments()

  const [startTime, setStartTime] = useState<number | null>(null)

  useEffect(() => {
    if (status === 'resolving') {
      setStartTime(Date.now())
    } else if (status === 'done' && startTime) {
      const duration = (Date.now() - startTime) / 1000
      logger.debug(`Time to render ${items.length} recent documents: ${duration.toFixed(2)}s`)
      setStartTime(null)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, logger])

  if (items.length > 0) {
    children = <HomepageRecentDocumentsTable />
  } else if (status === 'not_fetched') {
    children = null
  } else if (status === 'fetching' || (status === 'resolving' && items.length === 0)) {
    children = (
      <div className="flex h-full items-center justify-center">
        <CircleLoader size="large" />
      </div>
    )
  } else if (items.length === 0 && status === 'done') {
    children = <HomepageNoItemsContent />
  } else {
    children = <HomepageRecentDocumentsTable />
  }

  return (
    <div className="homepage-content-wrapper flex h-full w-full flex-col px-2 pt-2">
      <InvitesTable className="mb-5" />
      <div className="homepage-content bg-norm border-weak shadow-raised flex w-full flex-1 flex-col overflow-auto rounded-t-xl border">
        {children}
      </div>
    </div>
  )
}
