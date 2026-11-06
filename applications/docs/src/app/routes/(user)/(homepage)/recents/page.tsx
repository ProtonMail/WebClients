import { HomepageContent, HomepageLayout } from '~/homepage'
import { DocumentActionsProvider } from './__utils/document-actions'
import { HomepageViewProvider } from './__utils/homepage-view-sdk'

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
