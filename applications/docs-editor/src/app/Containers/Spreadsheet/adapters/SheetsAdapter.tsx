import useNotifications from '@proton/components/hooks/useNotifications'
import { isDevOrBlack } from '@proton/utils/env'
import type { PropsWithChildren } from 'react'
import { useMemo } from 'react'

import { useApplication } from '../../ApplicationProvider'
import { SheetsDependenciesProvider, type SheetsDependencies } from '../SheetsDependenciesProvider'

/**
 * The glue layer that collects all the SheetsDependencies required by the sheets editor and
 * provides them to the standalone sheets editor.
 */
export function SheetsAdapter({ children }: PropsWithChildren) {
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
      showNotification: createNotification,
    }),
    [application.appVersion, application.environment, canEdit, canTrash, createNotification],
  )

  return <SheetsDependenciesProvider dependencies={dependencies}>{children}</SheetsDependenciesProvider>
}
