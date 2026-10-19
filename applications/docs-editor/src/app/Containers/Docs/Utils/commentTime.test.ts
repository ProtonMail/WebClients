import { commentDate, formatAbsoluteTime, formatRelativeTime, isNewerThan } from './commentTime'

const secondsSince1970 = (date: Date) => Math.round(date.getTime() / 1000)
const minutesAgo = (minutes: number) => ({ serverTimestamp: secondsSince1970(new Date(Date.now() - minutes * 60000)) })

describe('comment time', () => {
  describe('commentDate', () => {
    it.each([
      ['seconds', 1704204240],
      ['milliseconds', 1704204240000],
      ['microseconds', 1704204240000000],
    ])('reads a host timestamp given in %s as the same instant', (_precision, serverTimestamp) => {
      expect(commentDate({ serverTimestamp }).toISOString()).toBe('2024-01-02T14:04:00.000Z')
    })

    it('rejects a timestamp whose precision it cannot tell', () => {
      expect(() => commentDate({ serverTimestamp: 17042 })).toThrow('17042')
    })
  })

  describe('isNewerThan', () => {
    it('counts a comment made within the last ten seconds as newer', () => {
      expect(isNewerThan({ serverTimestamp: secondsSince1970(new Date(Date.now() - 4000)) }, 10, 'seconds')).toBe(true)
      expect(isNewerThan({ serverTimestamp: secondsSince1970(new Date(Date.now() - 14000)) }, 10, 'seconds')).toBe(
        false,
      )
    })

    it('counts a comment made within the last hour as newer', () => {
      expect(isNewerThan(minutesAgo(59), 60, 'minutes')).toBe(true)
      expect(isNewerThan(minutesAgo(61), 60, 'minutes')).toBe(false)
    })
  })

  describe('formatRelativeTime', () => {
    it('names how many minutes ago the comment was made, in the host language', () => {
      expect(formatRelativeTime(minutesAgo(5), 'en')).toBe('5 min. ago')
      expect(formatRelativeTime(minutesAgo(59), 'en')).toBe('59 min. ago')
      // French separates the number from its unit with a non-breaking space.
      expect(formatRelativeTime(minutesAgo(5), 'fr').replace(/\s/g, ' ')).toBe('il y a 5 min')
    })

    it('falls back to English for a language code Intl does not know', () => {
      expect(formatRelativeTime(minutesAgo(5), 'not a language')).toBe('5 min. ago')
    })
  })

  describe('formatAbsoluteTime', () => {
    const british24Hour = { localeCode: 'en-GB', hourCycle: 'h23' } as const

    it('shows only the time for a comment made today', () => {
      const today = new Date()
      today.setHours(15, 4, 0, 0)
      expect(formatAbsoluteTime({ serverTimestamp: secondsSince1970(today) }, british24Hour)).toBe('15:04')
    })

    it('shows the date and the time for a comment made on another day', () => {
      const anotherDay = new Date(2024, 0, 2, 15, 4)
      expect(formatAbsoluteTime({ serverTimestamp: secondsSince1970(anotherDay) }, british24Hour)).toBe(
        '2 Jan 2024, 15:04',
      )
    })

    it("uses the host's hour cycle even where the locale defaults to the other one", () => {
      const anotherDay = new Date(2024, 0, 2, 15, 4)
      const serverTimestamp = secondsSince1970(anotherDay)
      expect(formatAbsoluteTime({ serverTimestamp }, { localeCode: 'en-US', hourCycle: 'h23' })).toBe(
        'Jan 2, 2024, 15:04',
      )
      expect(formatAbsoluteTime({ serverTimestamp }, { localeCode: 'en-GB', hourCycle: 'h12' })).toBe(
        '2 Jan 2024, 3:04 pm',
      )
    })

    it('falls back to English for a locale code Intl does not know, keeping the hour cycle', () => {
      const anotherDay = new Date(2024, 0, 2, 15, 4)
      expect(
        formatAbsoluteTime(
          { serverTimestamp: secondsSince1970(anotherDay) },
          { localeCode: 'not a language', hourCycle: 'h12' },
        ),
      ).toBe('Jan 2, 2024, 3:04 PM')
    })
  })
})
