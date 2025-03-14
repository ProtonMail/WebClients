import { useState } from 'react'
import { HomepageContent } from './HomepageContent/HomepageContent'
import { HomepageLayout } from './HomepageLayout'
import { useRouteMatch } from 'react-router-dom'
import { RecentDocumentsProvider } from './utils/recent-documents'

export default function HomepageRoute() {
  const [searchText, setSearchText] = useState('')

  let filter = ''
  if (useRouteMatch('/owned-by-me')) {
    filter = 'owned-by-me'
  }
  if (useRouteMatch('/owned-by-others')) {
    filter = 'owned-by-others'
  }

  return (
    <HomepageLayout onSearchTextChange={setSearchText}>
      <RecentDocumentsProvider searchText={searchText} filter={filter}>
        <HomepageContent />
      </RecentDocumentsProvider>
    </HomepageLayout>
  )
}
