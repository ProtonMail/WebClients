import { GlobalLoader, GlobalLoaderProvider, LocationErrorBoundary } from '@proton/components'
import { DriveStoreProvider } from '@proton/drive-store'
import { UserAppContent } from './UserAppContent'

export function UserAppRootContainer() {
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
