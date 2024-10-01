import metrics from '@proton/metrics'
import { getBrowserForMetrics } from './getBrowserForMetrics'
import { sendTelemetryReport } from '@proton/shared/lib/helpers/metrics'
import type { Api } from '@proton/shared/lib/interfaces'
import type { TelemetryDocsEvents } from '@proton/shared/lib/api/telemetry'
import { TelemetryMeasurementGroups } from '@proton/shared/lib/api/telemetry'

const HEARTBEAT_INTERVAL = 60_000

export class MetricService {
  private heartbeatInterval: NodeJS.Timeout | null = null

  constructor(private readonly api: Api) {}

  initialize(): void {
    this.heartbeat()

    this.heartbeatInterval = setInterval(() => {
      this.heartbeat()
    }, HEARTBEAT_INTERVAL)
  }

  heartbeat(): void {
    metrics.docs_open_documents_heartbeat_total.increment({
      browser: getBrowserForMetrics(),
    })
  }

  destroy(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval)
    }
  }

  reportSuggestionsTelemetry(event: TelemetryDocsEvents): void {
    void sendTelemetryReport({
      api: this.api,
      measurementGroup: TelemetryMeasurementGroups.docsSuggestions,
      event: event,
    })
  }
}
