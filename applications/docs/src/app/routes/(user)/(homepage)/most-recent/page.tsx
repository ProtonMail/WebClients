import { useState } from 'react'
import { HomepageLayout } from './__components/HomepageLayout'
import { useRouteMatch } from 'react-router-dom'
import { RecentDocumentsProvider } from './__utils/recent-documents'
import { HomepageContent } from './__components/HomepageContent/HomepageContent'

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
