import { GlobalLoader, GlobalLoaderProvider, LocationErrorBoundary } from '@proton/components'
import { DriveStoreProvider } from '@proton/drive-store'
import UserApplicationContent from './UserApplicationContent'

const UserAppRootContainer = () => {
  return (
    <GlobalLoaderProvider>
      <GlobalLoader />
      <LocationErrorBoundary>
        <DriveStoreProvider>
          <UserApplicationContent />
        </DriveStoreProvider>
      </LocationErrorBoundary>
    </GlobalLoaderProvider>
  )
}

export default UserAppRootContainer
