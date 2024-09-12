import { GlobalLoader, GlobalLoaderProvider, LocationErrorBoundary } from '@proton/components'
import { QuickSettingsRemindersProvider } from '@proton/components/hooks/drawer/useQuickSettingsReminders'
import { DriveStoreProvider } from '@proton/drive-store'
import ApplicationContainer from './ApplicationContainer'

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
