import { useState } from 'react'
import { HomepageContent } from './HomepageContent'
import HomepageLayout from './HomepageLayout'
import { useRouteMatch } from 'react-router-dom'
import { RecentDocumentsProvider } from './useRecentDocuments'

export default function HomepageRoute() {
  const [searchText, setSearchText] = useState('')
  const isOwnedByMe = useRouteMatch('/owned-by-me')
  const isOwnedByOthers = useRouteMatch('/owned-by-others')

  let filter = ''

  if (isOwnedByMe) {
    filter = 'owned-by-me'
  }
  if (isOwnedByOthers) {
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
