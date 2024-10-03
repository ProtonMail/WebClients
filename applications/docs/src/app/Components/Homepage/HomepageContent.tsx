import type { ReactNode } from 'react'
import { CircleLoader } from '@proton/atoms'
import { HomepageNoItemsContent } from './HomepageNoItemsContent'
import { HomepageRecentDocumentsTable } from './HomepageRecentDocumentsTable'

import './HomepageContent.scss'
import { useRecentDocuments } from './useRecentDocuments'

export function HomepageContent() {
  let children: ReactNode

  const { state, items } = useRecentDocuments()

  if (state.state === 'not_fetched') {
    children = null
  } else if (state.state === 'fetching') {
    children = (
      <div className="flex h-full items-center justify-center">
        <CircleLoader size="large" />
      </div>
    )
  } else if (items.length === 0) {
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
