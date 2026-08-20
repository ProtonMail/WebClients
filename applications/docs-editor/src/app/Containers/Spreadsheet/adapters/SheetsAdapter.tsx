import useNotifications from '@proton/components/hooks/useNotifications'
import { isDevOrBlack } from '@proton/utils/env'
import type { PropsWithChildren } from 'react'
import { useMemo } from 'react'

import { SheetsDependenciesProvider, type SheetsDependencies } from '../SheetsDependenciesProvider'

/**
 * The glue layer that collects all the SheetsDependencies required by the sheets editor and
 * provides them to the standalone sheets editor.
 */
export function SheetsAdapter({ children }: PropsWithChildren) {
  const { createNotification } = useNotifications()

  const dependencies = useMemo<SheetsDependencies>(
    () => ({
      isDevOrBlack,
      showNotification: createNotification,
    }),
    [createNotification],
  )

  return <SheetsDependenciesProvider dependencies={dependencies}>{children}</SheetsDependenciesProvider>
}
