import { useNotifications } from '@proton/app-context/useNotifications'
import type { EditorRequiresClientMethods } from '@proton/docs-shared'
import { isDevOrBlack } from '@proton/utils/env'
import type { PropsWithChildren } from 'react'
import { useMemo } from 'react'

import { reportErrorToSentry } from '../../../Utils/errorMessage'
import { useApplication } from '../../ApplicationProvider'
import { SheetsDependenciesProvider, type SheetsDependencies } from '../SheetsDependenciesProvider'

type SheetsAdapterProps = PropsWithChildren<{
  clientInvoker: EditorRequiresClientMethods
}>

/**
 * The glue layer that collects all the SheetsDependencies required by the sheets editor and
 * provides them to the standalone sheets editor.
 */
export function SheetsAdapter({ children, clientInvoker }: SheetsAdapterProps) {
  const { createNotification } = useNotifications()
  const { application } = useApplication()

  const role = application.getRole()
  const canEdit = role.canEdit()
  const canTrash = role.canTrash()

  const dependencies = useMemo<SheetsDependencies>(
    () => ({
      isDevOrBlack,
      canEdit,
      canTrash,
      versionInfo: {
        environment: application.environment,
        version: application.appVersion,
      },
      logger: application.logger,
      showNotification: createNotification,
      // Dependencies that use the clientInvoker
      isFeatureFlagEnabled: (featureFlag) => clientInvoker.checkIfFeatureFlagIsEnabled(featureFlag),
      openLink: (url) => {
        void clientInvoker.openLink(url).catch(reportErrorToSentry)
      },
      handleFileMenuAction: (action) => clientInvoker.handleFileMenuAction(action),
    }),
    [
      application.appVersion,
      application.environment,
      application.logger,
      canEdit,
      canTrash,
      clientInvoker,
      createNotification,
    ],
  )

  return <SheetsDependenciesProvider dependencies={dependencies}>{children}</SheetsDependenciesProvider>
}
