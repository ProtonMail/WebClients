import { useState } from 'react'
import { HomepageLayout } from './__components/HomepageLayout'
import { RecentDocumentsProvider } from './__utils/recent-documents'
import { HomepageContent } from './__components/HomepageContent/HomepageContent'

export default function HomepagePage() {
  const [searchText, setSearchText] = useState('')

  let filter = ''

  return (
    <HomepageLayout onSearchTextChange={setSearchText}>
      <RecentDocumentsProvider searchText={searchText} filter={filter}>
        <HomepageContent />
      </RecentDocumentsProvider>
    </HomepageLayout>
  )
}
