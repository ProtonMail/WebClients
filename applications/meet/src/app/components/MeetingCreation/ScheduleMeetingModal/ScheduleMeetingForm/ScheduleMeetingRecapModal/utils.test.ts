import { calendarDateFormats } from './utils';

describe('calendarDateFormats', () => {
    it('writes the Vancouver wall clock time after the move to permanent time', () => {
        expect(calendarDateFormats(new Date('2026-11-12T17:00:00Z'), 'America/Vancouver')).toEqual({
            localCompactWithTimezone: '20261112T100000',
            utcCompact: '20261112T170000Z',
            utcISO: '2026-11-12T17:00:00Z',
        });
    });
});
