import metrics from '@proton/metrics/metricsInstance'
import { MetricService } from './MetricService'
import type { Api } from '@proton/shared/lib/interfaces/Api'

vi.mock('@proton/metrics/metricsInstance')

describe('MetricService', () => {
  let metricService: MetricService

  beforeEach(() => {
    const api = {} as unknown as Api

    metricService = new MetricService(api, 'private')

    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()

    metricService.destroy()
  })

  describe('initialize', () => {
    it('should heartbeat once immediately', () => {
      const spy = vi.spyOn(metricService, 'heartbeat')

      metricService.initialize()

      expect(spy).toHaveBeenCalled()
    })

    it('should heartbeat every 60 seconds', () => {
      const spy = vi.spyOn(metricService, 'heartbeat')

      metricService.initialize()

      expect(spy).toHaveBeenCalledTimes(1)

      vi.advanceTimersByTime(60_000)

      expect(spy).toHaveBeenCalledTimes(2)
    })
  })

  describe('heartbeat', () => {
    it('should increment the docs_open_documents_heartbeat_total metric', () => {
      metricService.heartbeat()

      expect(metrics.docs_open_documents_heartbeat_total.increment).toHaveBeenCalled()
    })
  })
})
