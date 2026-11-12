import { useEffect, useMemo, useState } from 'react'
import { useLocation } from 'react-router-dom-v5-compat'

import { getUrlPassword } from '@proton/docs-shared/URL/getUrlPassword'
import type { DriveCompat } from '@proton/drive-store/lib/useDriveCompat'
import useEffectOnce from '@proton/hooks/useEffectOnce'
import { version as realtimeSdkVersion } from '@proton-docs/realtime-sdk'

import { useApplication } from '~/utils/application-context'
import { DebugModeProvider } from '~/utils/debug-mode-context'
import { parseOpenAction, useDocsUrlBar } from '~/utils/docs-url-bar'
import { DocumentCreator } from './__components/DocumentCreator'
import { DocumentLoader } from './__components/DocumentLoader'
import { DocumentShell } from './__components/DocumentShell'
import { DocumentViewerV2 } from './__components/DocumentViewerV2'
import { OpenActionError } from './__components/OpenActionError'
import { DocsLoadMark, markDocsLoad } from './__utils/loadMarks'
import { resolveOpenAction } from './__utils/resolveOpenAction'

export type DocumentPageV2Props = { driveCompat: DriveCompat }

export default function DocumentPageV2({ driveCompat }: DocumentPageV2Props) {
  const application = useApplication()
  const { navigateToAction, updateParameters } = useDocsUrlBar()
  // A retry remounts the creator or viewer, which restarts everything it runs
  const [attempt, setAttempt] = useState(0)
  const retry = () => setAttempt((attempt) => attempt + 1)

  // Not useDocsUrlBar().openAction: that is parsed once, from the first URL the app loaded.
  const { pathname, search } = useLocation()
  const openAction = useMemo(() => parseOpenAction(new URLSearchParams(search), pathname), [pathname, search])
  const resolution = useMemo(() => resolveOpenAction(openAction, search), [openAction, search])

  useEffectOnce(() => {
    application.logger.info('Document page v2 on realtime SDK', { realtimeSdkVersion })
    markDocsLoad(DocsLoadMark.RouteMounted)
  })

  useEffect(() => {
    application.logger.info('Resolved open action', { resolution })
  }, [application.logger, resolution])

  useEffect(() => {
    if (resolution.kind === 'redirect' && openAction?.mode === 'open-url-reauth') {
      navigateToAction({ ...openAction, mode: 'open-url', urlPassword: getUrlPassword() }, 'public')
    }
  }, [navigateToAction, openAction, resolution.kind])

  // Here, not in the viewer, which a retry remounts: once downloaded, a retry doesn't download it again
  const [downloadedOnOpen, setDownloadedOnOpen] = useState<string>()
  // As /doc does: the address bar opens the document from now on, so a reload doesn't download it again
  const downloadOnOpen = resolution.kind === 'open' && resolution.downloadOnOpen === true
  useEffect(() => {
    if (downloadOnOpen && openAction?.mode === 'download') {
      updateParameters({ newVolumeId: openAction.volumeId, newLinkId: openAction.linkId })
    }
  }, [downloadOnOpen, openAction, updateParameters])

  return <DebugModeProvider>{renderResolution()}</DebugModeProvider>

  function renderResolution() {
    switch (resolution.kind) {
      case 'error':
        return <OpenActionError reason={resolution.reason} />
      case 'create':
        return <DocumentCreator key={attempt} parent={resolution.parent} driveCompat={driveCompat} onRetry={retry} />
      case 'open': {
        const { volumeId, linkId } = resolution.nodeMeta
        const documentKey = `${volumeId}/${linkId}`
        return (
          <DocumentViewerV2
            key={`${documentKey}/${attempt}`}
            nodeMeta={resolution.nodeMeta}
            driveCompat={driveCompat}
            onRetry={retry}
            downloadOnOpen={resolution.downloadOnOpen && downloadedOnOpen !== documentKey}
            onDownloadedOnOpen={() => setDownloadedOnOpen(documentKey)}
          />
        )
      }
      case 'redirect':
        return (
          <DocumentShell header={null}>
            <DocumentLoader />
          </DocumentShell>
        )
    }
  }
}
