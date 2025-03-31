import { HomepageLayout } from './__components/HomepageLayout'
import { DocumentActionsProvider } from './__utils/document-actions'
import { HomepageContent } from './__components/HomepageContent/HomepageContent'
import { HomepageViewProvider } from './__utils/homepage-view'

export default function HomepagePage() {
  return (
    <HomepageViewProvider>
      <DocumentActionsProvider>
        <HomepageLayout>
          <HomepageContent />
        </HomepageLayout>
      </DocumentActionsProvider>
    </HomepageViewProvider>
  )
}
