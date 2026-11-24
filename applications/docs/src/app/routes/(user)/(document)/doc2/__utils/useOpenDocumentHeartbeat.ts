import { useEffect } from 'react'

import metrics from '@proton/metrics/metricsInstance'
import { isChrome, isEdgeChromium, isFirefox, isSafari } from '@proton/shared/lib/helpers/browser'

const HEARTBEAT_INTERVAL = 60_000

type DocType = Parameters<(typeof metrics.docs_open_documents_heartbeat_total)['increment']>[0]['docType']

/**
 * Counts the open document for the open-documents metric, at once and then every minute while mounted. Adapted from
 * `packages/docs-core/lib/Services/Metrics/MetricService.ts`, its `initialize` and `heartbeat`, which the Application
 * starts; doc2's public page has no Application, and stops it on unmount.
 */
export function useOpenDocumentHeartbeat(docType: DocType) {
  useEffect(() => {
    const heartbeat = () =>
      metrics.docs_open_documents_heartbeat_total.increment({ browser: getBrowserForMetrics(), docType })
    heartbeat()
    const interval = setInterval(heartbeat, HEARTBEAT_INTERVAL)
    return () => clearInterval(interval)
  }, [docType])
}

/** Copied from `packages/docs-core/lib/Services/Metrics/getBrowserForMetrics.ts` */
function getBrowserForMetrics() {
  if (isChrome()) {
    return 'chrome'
  }
  if (isFirefox()) {
    return 'firefox'
  }
  if (isSafari()) {
    return 'safari'
  }
  if (isEdgeChromium()) {
    return 'edge'
  }
  return 'other'
}
