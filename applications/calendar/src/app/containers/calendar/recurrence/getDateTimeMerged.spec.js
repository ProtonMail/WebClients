import { fromUTCDate } from 'proton-shared/lib/date/timezone';
import { getDateProperty, getDateTimeProperty } from 'proton-shared/lib/calendar/vcalConverter';
import { getStartDateTimeMerged } from './getDateTimeMerged';

const d = (year = 2000, month = 1, date = 1, hours = 0, minutes = 0) =>
    new Date(Date.UTC(year, month - 1, date, hours, minutes));

describe('merge date time', () => {
    it('should keep original start date', () => {
        const a = getDateProperty(fromUTCDate(d(2000, 1, 1)));
        const c = getDateTimeProperty(fromUTCDate(d(2000, 1, 3, 14, 30)), 'Europe/Zurich');
        const r = getDateTimeProperty(fromUTCDate(d(2000, 1, 1, 14, 30)), 'Europe/Zurich');
        expect(getStartDateTimeMerged(c, a)).toEqual(r);
    });

    it('should keep original start date even if day was moved', () => {
        const a = getDateProperty(fromUTCDate(d(2000, 1, 1)));
        const c = getDateProperty(fromUTCDate(d(2000, 1, 4)));

        expect(getStartDateTimeMerged(c, a)).toEqual(getDateProperty(fromUTCDate(d(2000, 1, 1))));
    });

    it('should keep original start date-time', () => {
        const a = getDateTimeProperty(fromUTCDate(d(2000, 1, 1, 14, 30)), 'Europe/Zurich');
        const c = getDateTimeProperty(fromUTCDate(d(2000, 1, 2, 12, 30)), 'Europe/Zurich');
        const r = getDateTimeProperty(fromUTCDate(d(2000, 1, 1, 12, 30)), 'Europe/Zurich');

        expect(getStartDateTimeMerged(c, a)).toEqual(r);
    });

    it('should keep original start date-time', () => {
        const a = getDateTimeProperty(fromUTCDate(d(2000, 1, 1, 14, 30)), 'Europe/Madrid');
        const c = getDateTimeProperty(fromUTCDate(d(2000, 1, 2, 12, 0)), 'UTC');
        const r = getDateTimeProperty(fromUTCDate(d(2000, 1, 1, 12, 0)), 'UTC');

        expect(getStartDateTimeMerged(c, a)).toEqual(r);
    });
});
