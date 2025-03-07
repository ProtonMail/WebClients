import { GlobalLoader, GlobalLoaderProvider, LocationErrorBoundary } from '@proton/components'
import { DriveStoreProvider } from '@proton/drive-store'
import UserAppContent from './UserAppContent'

const UserAppRootContainer = () => {
  return (
    <GlobalLoaderProvider>
      <GlobalLoader />
      <LocationErrorBoundary>
        <DriveStoreProvider>
          <UserAppContent />
        </DriveStoreProvider>
      </LocationErrorBoundary>
    </GlobalLoaderProvider>
  )
}

export default UserAppRootContainer
