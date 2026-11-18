import { ServerTime } from './serverTime'

// 2023-11-14T22:13:20.123Z
const MILLISECONDS = 1_700_000_000_123

describe('ServerTime', () => {
  test('reads a timestamp in seconds, as the recents API sends LastOpenTime', () => {
    expect(new ServerTime(1_700_000_000).date.toISOString()).toBe('2023-11-14T22:13:20.000Z')
  })

  test('reads a timestamp in milliseconds, as a trashed node gives it', () => {
    expect(new ServerTime(MILLISECONDS).date.toISOString()).toBe('2023-11-14T22:13:20.123Z')
  })

  test('reads a timestamp in microseconds, dropping what is below a millisecond', () => {
    expect(new ServerTime(1_700_000_000_123_999).milliseconds).toBe(MILLISECONDS)
  })

  test('refuses a timestamp of another precision instead of placing it in 1970', () => {
    expect(() => new ServerTime(17_000_000_001).date).toThrow('Unhandled timestamp precision')
  })
})
