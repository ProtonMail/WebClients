import { ExponentialBackoff } from '../Util/ExponentialBackoff'

describe('ExponentialBackoff', () => {
  const backoff = new ExponentialBackoff()

  beforeEach(() => {
    backoff.resetAttempts()
  })

  it('should have minimum 2 second backoff if no attempts', () => {
    expect(backoff.getBackoffTime()).toBe(2000)
  })

  it('should return backoff time and limit to max backoff time', () => {
    backoff.incrementAttempts()
    expect(backoff.getBackoffTime()).toBe(2000)

    backoff.incrementAttempts()
    expect(backoff.getBackoffTime()).toBe(4000)

    backoff.incrementAttempts()
    expect(backoff.getBackoffTime()).toBe(8000)

    backoff.incrementAttempts()
    expect(backoff.getBackoffTime()).toBe(16000)

    backoff.incrementAttempts()
    expect(backoff.getBackoffTime()).toBe(32000)

    backoff.incrementAttempts()
    expect(backoff.getBackoffTime()).toBe(32000)
  })

  it('should reset attempts', () => {
    backoff.incrementAttempts()
    expect(backoff.getBackoffTime()).toBe(2000)

    backoff.incrementAttempts()
    expect(backoff.getBackoffTime()).toBe(4000)

    backoff.resetAttempts()
    expect(backoff.getBackoffTime()).toBe(2000)
  })

  it('should get backoff with jitter', () => {
    backoff.getJitterFactor = jest.fn().mockReturnValue(1)

    backoff.incrementAttempts()
    expect(backoff.getBackoffWithJitter()).toBe(2000)

    backoff.getJitterFactor = jest.fn().mockReturnValue(1.5)

    backoff.incrementAttempts()
    expect(backoff.getBackoffWithJitter()).toBe(6000)
  })
})
