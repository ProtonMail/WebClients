import { setDateLocales } from '@proton/shared/lib/i18n'
import { DateFormatter } from './DateFormatter'

describe('DateFormatter', () => {
  beforeAll(() => {
    setDateLocales({ dateLocale: { code: 'en-US' } })
    jest.useFakeTimers().setSystemTime(new Date('2023-07-08'))
  })
  describe('formatDate', () => {
    it.each([
      [new Date('2023-07-07'), 'yesterday'],
      [new Date('2023-07-06'), 'Thursday'],
      [new Date('2023-06-05'), 'Jun 5'],
    ])('format %s to %s', (date, formatted) => {
      const dateFormatter = new DateFormatter()
      expect(dateFormatter.formatDate(date)).toBe(formatted)
    })
  })

  describe('formatDate', () => {
    it.each([
      [new Date('2023T04:25'), '4:25 AM'],
      [new Date('2023T13:00'), '1:00 PM'],
      [new Date('2023T00:00'), '12:00 AM'],
    ])('format %s to %s', (date, formatted) => {
      const dateFormatter = new DateFormatter()
      expect(dateFormatter.formatTime(date)).toBe(formatted)
    })
  })
})
