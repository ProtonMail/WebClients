import { QuickSettingsRemindersProvider } from '@proton/components/hooks/drawer/useQuickSettingsReminders'
import ApplicationContainer from './ApplicationContainer'
import { DriveStoreProvider } from '@proton/drive-store'
import { GlobalLoader, GlobalLoaderProvider } from '@proton/components/components'
import { LocationErrorBoundary } from '@proton/components/containers'

const MainContainer = () => {
  return (
    <GlobalLoaderProvider>
      <GlobalLoader />
      <LocationErrorBoundary>
        <QuickSettingsRemindersProvider>
          <DriveStoreProvider>
            <ApplicationContainer />
          </DriveStoreProvider>
        </QuickSettingsRemindersProvider>
      </LocationErrorBoundary>
    </GlobalLoaderProvider>
  )
}

export default MainContainer
