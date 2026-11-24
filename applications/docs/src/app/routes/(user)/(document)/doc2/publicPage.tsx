import { useEffect, useMemo, useState } from 'react'
import { useLocation } from 'react-router-dom-v5-compat'

import useEffectOnce from '@proton/hooks/useEffectOnce'
import { version as realtimeSdkVersion } from '@proton-docs/realtime-sdk'

import { useApplication } from '~/utils/application-context'
import { DebugModeProvider } from '~/utils/debug-mode-context'
import { parseOpenAction } from '~/utils/docs-url-bar'
import { usePublicEditingEnabled } from './__utils/flags'
import { OpenActionError } from './__components/OpenActionError'
import { PublicDocumentViewer } from './__components/PublicDocumentViewer'
import { DocsLoadMark, markDocsLoad } from './__utils/loadMarks'
import type { PublicLinkHandoff } from './__utils/publicLink'
import { loggableResolution, resolveOpenAction } from './__utils/resolveOpenAction'

export type PublicDocumentPageV2Props = PublicLinkHandoff

/**
 * doc2's page for a public link, which doc2's public app renders on `/doc2` once it signed into the share URL, with
 * `DocsRealtimeSdkEnabled` on. Unleash is ready by then, so `DocsPublicEditing` reads as the server has it.
 */
export default function PublicDocumentPageV2(handoff: PublicDocumentPageV2Props) {
  const application = useApplication()
  // Read once: a run opens with it, and a later change of the flag doesn't reopen the document
  const [publicEditing] = useState(usePublicEditingEnabled())
  // A retry remounts the viewer, which restarts everything it runs
  const [attempt, setAttempt] = useState(0)
  const retry = () => setAttempt((attempt) => attempt + 1)

  const { pathname, search } = useLocation()
  const resolution = useMemo(
    () => resolveOpenAction(parseOpenAction(new URLSearchParams(search), pathname), search),
    [pathname, search],
  )

  useEffectOnce(() => {
    application.logger.info('Public document page v2 on realtime SDK', {
      realtimeSdkVersion,
      providerType: handoff.providerType,
      publicEditing,
    })
    markDocsLoad(DocsLoadMark.RouteMounted)
  })

  useEffect(() => {
    application.logger.info('Resolved open action', loggableResolution(resolution))
  }, [application.logger, resolution])

  return <DebugModeProvider>{renderResolution()}</DebugModeProvider>

  function renderResolution() {
    switch (resolution.kind) {
      case 'openPublicLink':
        return (
          <PublicDocumentViewer
            key={attempt}
            token={resolution.token}
            handoff={handoff}
            publicEditing={publicEditing}
            onRetry={retry}
          />
        )
      case 'error':
        return <OpenActionError reason={resolution.reason} isPublic />
      // The public app boots only for a public link's modes
      default:
        return <OpenActionError reason="unsupported" isPublic />
    }
  }
}
