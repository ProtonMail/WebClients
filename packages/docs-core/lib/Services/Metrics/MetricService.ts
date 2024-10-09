import metrics from '@proton/metrics'
import { getBrowserForMetrics } from './getBrowserForMetrics'
import { sendTelemetryReport } from '@proton/shared/lib/helpers/metrics'
import type { Api } from '@proton/shared/lib/interfaces'
import type { TelemetryDocsEvents } from '@proton/shared/lib/api/telemetry'
import { TelemetryMeasurementGroups } from '@proton/shared/lib/api/telemetry'
import type { SuggestionSummaryType } from 'packages/docs-shared/lib/SuggestionType'

const HEARTBEAT_INTERVAL = 60_000

type MetricSuggestionType = 'insertion' | 'replacement' | 'deletion' | 'formatting' | 'style' | 'other'

const SuggestionTypeToMetricSuggestionType: Record<SuggestionSummaryType, MetricSuggestionType> = {
  insert: 'insertion',
  delete: 'deletion',
  'property-change': 'style',
  split: 'insertion',
  join: 'deletion',
  'link-change': 'other',
  'style-change': 'style',
  replace: 'replacement',
  'add-link': 'other',
  'delete-link': 'other',
  'image-change': 'other',
  'insert-image': 'insertion',
  'delete-image': 'deletion',
}

type SuggestionResolution = 'accepted' | 'rejected'

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

  reportFullyBlockingErrorModal(): void {
    metrics.docs_alert_modal_total.increment({})
  }

  reportSuggestionCreated(type?: SuggestionSummaryType): void {
    const metricType = type ? SuggestionTypeToMetricSuggestionType[type] : 'other'
    metrics.docs_suggestions_created_total.increment({ type: metricType })
  }

  reportSuggestionResolved(resolution: SuggestionResolution): void {
    metrics.docs_suggestions_resolved_total.increment({ type: resolution })
  }
}
