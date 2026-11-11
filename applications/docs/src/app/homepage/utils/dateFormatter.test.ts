import { DateFormatter } from './dateFormatter'

describe('DateFormatter', () => {
  beforeAll(() => {
    jest.useFakeTimers().setSystemTime(new Date('2023-07-08'))
  })
  describe('formatDate', () => {
    it.each([
      [new Date('2023-07-07'), 'yesterday'],
      [new Date('2023-07-06'), 'Thursday'],
      [new Date('2023-06-05'), 'Jun 5'],
    ])('format %s to %s', (date, formatted) => {
      const dateFormatter = new DateFormatter('en-US')
      expect(dateFormatter.formatDate(date)).toBe(formatted)
    })
  })

  describe('formatTime', () => {
    it.each([
      [new Date('2023T04:25'), '4:25 AM'],
      [new Date('2023T13:00'), '1:00 PM'],
      [new Date('2023T00:00'), '12:00 AM'],
    ])('format %s to %s', (date, formatted) => {
      const dateFormatter = new DateFormatter('en-US')
      expect(dateFormatter.formatTime(date)).toBe(formatted)
    })
  })

  describe('formatDateOrTimeIfToday', () => {
    it.each([
      [new Date('2023-07-08T00:00:00'), new Date('2023-07-08T00:00:10'), 'Just now'],
      [new Date('2023-07-08T00:00:00'), new Date('2023-07-08T00:00:30'), '30 seconds ago'],
      [new Date('2023-07-08T00:00:00'), new Date('2023-07-08T00:05:00'), '5 minutes ago'],
      [new Date('2023-07-08T00:00:00'), new Date('2023-07-08T03:00:00'), '3 hours ago'],
      [new Date('2023-07-08T00:00:00'), new Date('2023-07-08T13:00:00'), '12:00 AM'],
      [new Date('2023-07-07T12:00:00'), new Date('2023-07-08T13:00:00'), 'yesterday'],
    ])('format %s at %s to %s', (date, now, formatted) => {
      jest.setSystemTime(now)
      const dateFormatter = new DateFormatter('en-US')
      expect(dateFormatter.formatDateOrTimeIfToday(date, 'Just now')).toBe(formatted)
    })
  })
})
