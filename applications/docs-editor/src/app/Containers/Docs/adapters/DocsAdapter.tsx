import { isDevOrBlack } from '@proton/shared/lib/env'
import type { PropsWithChildren } from 'react'
import { useMemo, useCallback } from 'react'

import { DocsDependenciesProvider, type DocsDependencies } from '../DocsDependenciesProvider'
import type { EditorRequiresClientMethods } from '@proton/docs-shared'
import { reportErrorToSentry } from '../../../Utils/errorMessage'

/**
 * Collects the Docs dependencies supplied by the Docs shell and provides them
 * to the standalone Docs editor.
 */
export function DocsAdapter({
  children,
  clientInvoker,
}: PropsWithChildren<{
  clientInvoker: EditorRequiresClientMethods
}>) {
  const openLink = useCallback(
    (url: string) => {
      void clientInvoker.openLink(url).catch(reportErrorToSentry)
    },
    [clientInvoker],
  )

  const dependencies = useMemo<DocsDependencies>(
    () => ({
      isDevOrBlack,
      openLink,
    }),
    [openLink],
  )

  return <DocsDependenciesProvider dependencies={dependencies}>{children}</DocsDependenciesProvider>
}
