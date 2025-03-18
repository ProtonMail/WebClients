import { useState } from 'react'
import { HomepageLayout } from './__components/HomepageLayout'
import { RecentDocumentsProvider } from './__utils/recent-documents'
import { HomepageContent } from './__components/HomepageContent/HomepageContent'
import { useMatch } from 'react-router-dom-v5-compat'

export default function HomepageRoute() {
  const [searchText, setSearchText] = useState('')

  let filter = ''
  if (useMatch('/owned-by-me')) {
    filter = 'owned-by-me'
  }
  if (useMatch('/owned-by-others')) {
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
