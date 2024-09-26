import metrics from '@proton/metrics'
import { MetricService } from './MetricService'

jest.mock('@proton/metrics')

describe('MetricService', () => {
  let metricService: MetricService

  beforeEach(() => {
    metricService = new MetricService()

    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.useRealTimers()

    metricService.destroy()
  })

  describe('initialize', () => {
    it('should heartbeat once immediately', () => {
      const spy = jest.spyOn(metricService, 'heartbeat')

      metricService.initialize()

      expect(spy).toHaveBeenCalled()
    })

    it('should heartbeat every 60 seconds', () => {
      const spy = jest.spyOn(metricService, 'heartbeat')

      metricService.initialize()

      expect(spy).toHaveBeenCalledTimes(1)

      jest.advanceTimersByTime(60_000)

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
