import { useEffect, useState, type ReactNode } from 'react'
import { CircleLoader } from '@proton/atoms'
import { HomepageNoItemsContent } from './HomepageNoItemsContent'
import { HomepageRecentDocumentsTable } from './HomepageRecentDocumentsTable'

import './HomepageContent.scss'
import { useRecentDocuments } from './useRecentDocuments'
import { useApplication } from '../../Containers/ApplicationProvider'

export function HomepageContent() {
  let children: ReactNode

  const { logger } = useApplication()

  const { state, items } = useRecentDocuments()

  const [startTime, setStartTime] = useState<number | null>(null)

  useEffect(() => {
    if (state === 'resolving') {
      setStartTime(Date.now())
    } else if (state === 'done' && startTime) {
      const duration = (Date.now() - startTime) / 1000
      logger.debug(`Time to render ${items.length} recent documents: ${duration.toFixed(2)}s`)
      setStartTime(null)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state, logger])

  if (state === 'not_fetched') {
    children = null
  } else if (state === 'fetching' || (state === 'resolving' && items.length === 0)) {
    children = (
      <div className="flex h-full items-center justify-center">
        <CircleLoader size="large" />
      </div>
    )
  } else if (items.length === 0 && state === 'done') {
    children = <HomepageNoItemsContent />
  } else {
    children = <HomepageRecentDocumentsTable />
  }

  return (
    <div className="homepage-content-wrapper w-full px-2 pt-2">
      <div className="homepage-content bg-norm border-weak shadow-raised h-full overflow-auto border">{children}</div>
    </div>
  )
}
