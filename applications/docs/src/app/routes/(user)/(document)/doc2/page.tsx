import { useEffect, useMemo, useState } from 'react'
import { useLocation } from 'react-router-dom-v5-compat'

import { getUrlPassword } from '@proton/docs-shared/URL/getUrlPassword'
import type { DriveCompat } from '@proton/drive-store/lib/useDriveCompat'
import useEffectOnce from '@proton/hooks/useEffectOnce'
import { useFlag } from '@proton/unleash/useFlag'
import { assignUrl } from '@proton/shared/lib/helpers/location'
import { version as realtimeSdkVersion } from '@proton-docs/realtime-sdk'

import { useApplication } from '~/utils/application-context'
import { DebugModeProvider } from '~/utils/debug-mode-context'
import { parseOpenAction, useDocsUrlBar } from '~/utils/docs-url-bar'
import { useDocsNotifications } from '../../__utils/notifications-context'
import { DocumentCreator } from './__components/DocumentCreator'
import { DocumentShell } from './__components/DocumentShell'
import { DocumentViewerV2 } from './__components/DocumentViewerV2'
import { useEmailOptInModal } from '../doc/__components/EmailOptInModal/EmailOptInModal'
import { LoadingScreen } from './__components/LoadingScreen'
import { OpenActionError } from './__components/OpenActionError'
import { DocsLoadMark, markDocsLoad } from './__utils/loadMarks'
import { getPublicLinkUrl } from './__utils/publicLink'
import { loggableResolution, resolveOpenAction } from './__utils/resolveOpenAction'

export type DocumentPageV2Props = { driveCompat: DriveCompat }

export default function DocumentPageV2({ driveCompat }: DocumentPageV2Props) {
  const application = useApplication()
  const { updateParameters } = useDocsUrlBar()
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
    application.logger.info('Resolved open action', loggableResolution(resolution))
  }, [application.logger, resolution])

  // Copied from `applications/docs/src/app/routes/(user)/(document)/doc/page.tsx`, its `open-url-reauth` redirect, back to
  // the public link on /doc2 rather than /doc
  useEffect(() => {
    if (resolution.kind === 'redirect' && openAction?.mode === 'open-url-reauth') {
      assignUrl(getPublicLinkUrl(openAction, getUrlPassword()))
    }
  }, [openAction, resolution.kind])

  // Here, not in the viewer, which a retry remounts: once downloaded, a retry doesn't download it again
  const [downloadedOnOpen, setDownloadedOnOpen] = useState<string>()
  // Copied from `applications/docs/src/app/routes/(user)/(document)/doc/page.tsx`, its download mode: the address bar
  // opens the document from now on, so a reload doesn't download it again
  const downloadOnOpen = resolution.kind === 'open' && resolution.downloadOnOpen === true
  useEffect(() => {
    if (downloadOnOpen && openAction?.mode === 'download') {
      updateParameters({ newVolumeId: openAction.volumeId, newLinkId: openAction.linkId })
    }
  }, [downloadOnOpen, openAction, updateParameters])

  // As for the download: once the history opened, a retry doesn't open it again
  const [historyOpenedOnOpen, setHistoryOpenedOnOpen] = useState<string>()
  // Copied from `applications/docs/src/app/routes/(user)/(document)/doc/page.tsx`, its history mode: the address bar
  // opens the document from now on, so a reload doesn't open the history again
  const historyOnOpen = resolution.kind === 'open' && resolution.historyOnOpen === true
  useEffect(() => {
    if (historyOnOpen && openAction?.mode === 'history') {
      updateParameters({ newVolumeId: openAction.volumeId, newLinkId: openAction.linkId })
    }
  }, [historyOnOpen, openAction, updateParameters])

  // Copied from `applications/docs/src/app/routes/(user)/(document)/doc/page.tsx`, its email opt-in trigger. Here, not in
  // the viewer, which a retry remounts, so a retry does not open it again. As on /doc, it shows over a document only.
  const [emailOptInModal, openEmailOptInModal] = useEmailOptInModal()
  const emailFeatureEnabled = useFlag('DocsEnableNotificationsOnNewComment')
  const { emailTitleEnabled, emailNotificationsEnabled, isReady: isNotificationsReady } = useDocsNotifications()
  useEffect(() => {
    if (!isNotificationsReady || !emailFeatureEnabled) {
      return
    }
    if (emailTitleEnabled === null || emailNotificationsEnabled === null) {
      openEmailOptInModal({})
    }
  }, [emailTitleEnabled, emailNotificationsEnabled, openEmailOptInModal, isNotificationsReady, emailFeatureEnabled])

  return (
    <DebugModeProvider>
      {renderResolution()}
      {resolution.kind === 'open' && emailOptInModal}
    </DebugModeProvider>
  )

  function renderResolution() {
    switch (resolution.kind) {
      case 'error':
        return <OpenActionError reason={resolution.reason} />
      // The public app opens a public link: the user app never gets one
      case 'openPublicLink':
        return <OpenActionError reason="unsupported" />
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
            historyOnOpen={resolution.historyOnOpen && historyOpenedOnOpen !== documentKey}
            onHistoryOpenedOnOpen={() => setHistoryOpenedOnOpen(documentKey)}
          />
        )
      }
      case 'redirect':
        return <DocumentShell header={null} loadingScreen={<LoadingScreen status="redirecting" />} />
    }
  }
}
