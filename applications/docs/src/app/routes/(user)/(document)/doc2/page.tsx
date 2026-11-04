import { useEffect, useMemo, useState } from 'react'
import { useLocation } from 'react-router-dom-v5-compat'

import { getUrlPassword } from '@proton/docs-shared/URL/getUrlPassword'
import type { DriveCompat } from '@proton/drive-store/lib/useDriveCompat'
import useEffectOnce from '@proton/hooks/useEffectOnce'
import { version as realtimeSdkVersion } from '@proton-docs/realtime-sdk'

import { useApplication } from '~/utils/application-context'
import { parseOpenAction, useDocsUrlBar } from '~/utils/docs-url-bar'
import { DocumentCreator } from './__components/DocumentCreator'
import { DocumentLoader } from './__components/DocumentLoader'
import { DocumentViewerV2 } from './__components/DocumentViewerV2'
import { OpenActionError } from './__components/OpenActionError'
import { resolveOpenAction } from './__utils/resolveOpenAction'

export type DocumentPageV2Props = { driveCompat: DriveCompat }

export default function DocumentPageV2({ driveCompat }: DocumentPageV2Props) {
  const application = useApplication()
  const { navigateToAction } = useDocsUrlBar()
  // A retry remounts the creator or viewer, which restarts everything it runs
  const [attempt, setAttempt] = useState(0)
  const retry = () => setAttempt((attempt) => attempt + 1)

  // Not useDocsUrlBar().openAction: that is parsed once, from the first URL the app loaded.
  const { pathname, search } = useLocation()
  const openAction = useMemo(() => parseOpenAction(new URLSearchParams(search), pathname), [pathname, search])
  const resolution = useMemo(() => resolveOpenAction(openAction, search), [openAction, search])

  useEffectOnce(() => {
    application.logger.info('Document page v2 on realtime SDK', { realtimeSdkVersion })
  })

  useEffect(() => {
    application.logger.info('Resolved open action', { resolution })
  }, [application.logger, resolution])

  useEffect(() => {
    if (resolution.kind === 'redirect' && openAction?.mode === 'open-url-reauth') {
      navigateToAction({ ...openAction, mode: 'open-url', urlPassword: getUrlPassword() }, 'public')
    }
  }, [navigateToAction, openAction, resolution.kind])

  switch (resolution.kind) {
    case 'error':
      return <OpenActionError reason={resolution.reason} />
    case 'create':
      return <DocumentCreator key={attempt} parent={resolution.parent} driveCompat={driveCompat} onRetry={retry} />
    case 'open': {
      const { volumeId, linkId } = resolution.nodeMeta
      return (
        <DocumentViewerV2 key={`${volumeId}/${linkId}/${attempt}`} nodeMeta={resolution.nodeMeta} onRetry={retry} />
      )
    }
    case 'redirect':
      return <DocumentLoader />
  }
}
