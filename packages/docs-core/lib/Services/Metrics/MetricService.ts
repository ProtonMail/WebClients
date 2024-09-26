import metrics from '@proton/metrics'
import { getBrowserForMetrics } from './getBrowserForMetrics'

const HEARTBEAT_INTERVAL = 60_000

export class MetricService {
  private heartbeatInterval: NodeJS.Timeout | null = null

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
}
