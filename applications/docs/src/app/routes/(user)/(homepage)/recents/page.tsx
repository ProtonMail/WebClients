import { HomepageLayout } from './__components/HomepageLayout'
import { DocumentActionsProvider } from './__utils/document-actions'
import { HomepageContent } from './__components/HomepageContent/HomepageContent'
import { HomepageViewProvider } from './__utils/homepage-view'
import { HomepageViewProviderSDK } from './__utils/homepage-view-sdk'
import { useLoadRecentsWithSdkEnabled } from '~/utils/flags'

export default function HomepagePage() {
  const loadRecentsWithSdk = useLoadRecentsWithSdkEnabled()

  if (loadRecentsWithSdk) {
    return (
      <HomepageViewProviderSDK>
        <DocumentActionsProvider>
          <HomepageLayout>
            <HomepageContent />
          </HomepageLayout>
        </DocumentActionsProvider>
      </HomepageViewProviderSDK>
    )
  }

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
