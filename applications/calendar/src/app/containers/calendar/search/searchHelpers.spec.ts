import { getUnixTime } from 'date-fns';
import { default as frLocale } from 'date-fns/locale/fr';

import type { ESItem } from '@proton/encrypted-search/models';
import { MAXIMUM_DATE_UTC } from '@proton/shared/lib/calendar/constants';
import { SECOND } from '@proton/shared/lib/constants';
import { differenceInCalendarYears } from '@proton/shared/lib/date-fns-utc';

import type { ESCalendarContent, ESCalendarMetadata } from '../../../interfaces/encryptedSearch';
import { YEARS_TO_EXPAND_AHEAD } from './constants';
import { expandSearchItem } from './searchHelpers';

describe('expandSearchItem()', () => {
    describe('expands until given date + expected number of years', () => {
        it('for daily events', () => {
            const item = {
                FullDay: 0,
                StartTime: getUnixTime(Date.UTC(2001, 1, 22, 9)),
                StartTimezone: 'America/New_York',
                EndTime: getUnixTime(Date.UTC(2001, 1, 22, 9, 30)),
                EndTimezone: 'America/New_York',
                RRule: 'FREQ=DAILY',
                RecurrenceID: null,
                Exdates: [] as number[],
            } as ESItem<ESCalendarMetadata, ESCalendarContent>;
            const date = new Date(Date.UTC(2023, 8, 7, 10));
            const occurrences = expandSearchItem({ item, date }) as ESItem<ESCalendarMetadata, ESCalendarContent>[];

            const lastOccurrenceUtcStart = new Date(occurrences[occurrences.length - 1].StartTime * SECOND);

            expect(differenceInCalendarYears(lastOccurrenceUtcStart, date)).toBe(YEARS_TO_EXPAND_AHEAD.OTHER);
        });

        it('for weekly events with non-trivial recurring rule', () => {
            const item = {
                FullDay: 1,
                StartTime: getUnixTime(Date.UTC(2011, 5, 5)),
                StartTimezone: 'UTC',
                EndTime: getUnixTime(Date.UTC(2011, 5, 6)),
                EndTimezone: 'UTC',
                RRule: 'FREQ=WEEKLY;INTERVAL=2;BYDAY=MO,WE',
                RecurrenceID: null,
                Exdates: [] as number[],
            } as ESItem<ESCalendarMetadata, ESCalendarContent>;
            const date = new Date(Date.UTC(2023, 8, 7, 10));
            const occurrences = expandSearchItem({ item, date }) as ESItem<ESCalendarMetadata, ESCalendarContent>[];

            const lastOccurrenceUtcStart = new Date(occurrences[occurrences.length - 1].StartTime * SECOND);

            expect(differenceInCalendarYears(lastOccurrenceUtcStart, date)).toBe(YEARS_TO_EXPAND_AHEAD.OTHER);
        });

        it('for monthly events with non-trivial recurring rule', () => {
            const item = {
                FullDay: 1,
                StartTime: getUnixTime(Date.UTC(2017, 9, 9)),
                StartTimezone: 'UTC',
                EndTime: getUnixTime(Date.UTC(2017, 9, 10)),
                EndTimezone: 'UTC',
                RRule: 'FREQ=MONTHLY;BYDAY=2SU',
                RecurrenceID: null,
                Exdates: [] as number[],
            } as ESItem<ESCalendarMetadata, ESCalendarContent>;
            const date = new Date(Date.UTC(2023, 8, 7, 10));
            const occurrences = expandSearchItem({ item, date }) as ESItem<ESCalendarMetadata, ESCalendarContent>[];

            const lastOccurrenceUtcStart = new Date(occurrences[occurrences.length - 1].StartTime * SECOND);

            expect(differenceInCalendarYears(lastOccurrenceUtcStart, date)).toBe(YEARS_TO_EXPAND_AHEAD.OTHER);
        });

        it('for yearly events', () => {
            const item = {
                FullDay: 0,
                StartTime: getUnixTime(Date.UTC(1978, 4, 12, 23)),
                StartTimezone: 'Asia/Shanghai',
                EndTime: getUnixTime(Date.UTC(1978, 4, 13, 3, 30)),
                EndTimezone: 'Asia/Shanghai',
                RRule: 'FREQ=YEARLY',
                RecurrenceID: null,
                Exdates: [] as number[],
            } as ESItem<ESCalendarMetadata, ESCalendarContent>;
            const date = new Date(Date.UTC(2013, 8, 7, 10));
            const occurrences = expandSearchItem({ item, date }) as ESItem<ESCalendarMetadata, ESCalendarContent>[];

            const lastOccurrenceUtcStart = new Date(occurrences[occurrences.length - 1].StartTime * SECOND);

            expect(differenceInCalendarYears(lastOccurrenceUtcStart, date)).toBe(YEARS_TO_EXPAND_AHEAD.YEARLY);
        });
    });

    describe('caps the expansion at the maximum date', () => {
        it('for yearly events', () => {
            const item = {
                FullDay: 0,
                StartTime: getUnixTime(Date.UTC(1978, 4, 12, 23)),
                StartTimezone: 'Asia/Shanghai',
                EndTime: getUnixTime(Date.UTC(1978, 4, 13, 3, 30)),
                EndTimezone: 'Asia/Shanghai',
                RRule: 'FREQ=YEARLY',
                RecurrenceID: null,
                Exdates: [] as number[],
            } as ESItem<ESCalendarMetadata, ESCalendarContent>;
            const date = new Date(Date.UTC(2023, 8, 7, 10));
            const occurrences = expandSearchItem({ item, date }) as ESItem<ESCalendarMetadata, ESCalendarContent>[];

            const lastOccurrenceUtcStart = new Date(occurrences[occurrences.length - 1].StartTime * SECOND);

            expect(differenceInCalendarYears(lastOccurrenceUtcStart, date)).toBe(
                MAXIMUM_DATE_UTC.getUTCFullYear() - date.getUTCFullYear()
            );
        });
    });

    describe('does not expand beyond number of occurrences', () => {
        it('for a weekly event', () => {
            const item = {
                FullDay: 0,
                StartTime: getUnixTime(Date.UTC(2022, 2, 2, 15)),
                StartTimezone: 'America/Sao_Paulo',
                EndTime: getUnixTime(Date.UTC(2022, 2, 2, 18)),
                EndTimezone: 'America/Sao_Paulo',
                RRule: 'FREQ=WEEKLY;INTERVAL=2;COUNT=10',
                RecurrenceID: null,
                Exdates: [] as number[],
            } as ESItem<ESCalendarMetadata, ESCalendarContent>;
            const date = new Date(Date.UTC(2023, 8, 7, 10));
            const occurrences = expandSearchItem({ item, date }) as ESItem<ESCalendarMetadata, ESCalendarContent>[];

            const lastOccurrenceUtcStart = new Date(occurrences[occurrences.length - 1].StartTime * SECOND);

            expect(occurrences.length).toBe(10);
            expect(lastOccurrenceUtcStart.getUTCFullYear()).toBe(2022);
        });
    });
});

describe('getEventsDayDateString', () => {
    let getEventsDayDateString: (date: Date) => string;

    describe('when using the default locale', () => {
        beforeEach(async () => {
            getEventsDayDateString = (await import('./searchHelpers')).getEventsDayDateString;
        });

        it('should return the expected date', () => {
            const date = new Date('2020-01-01T12:00:00Z');
            expect(getEventsDayDateString(date)).toBe('Wed, Jan 2020');
        });
    });

    describe('when using a custom locale', () => {
        beforeEach(async () => {
            const mockLocale = frLocale;

            jest.mock('@proton/shared/lib/i18n', () => ({
                ...jest.requireActual('@proton/shared/lib/i18n'),
                dateLocale: mockLocale,
            }));
            jest.resetModules();
            getEventsDayDateString = (await import('./searchHelpers')).getEventsDayDateString;
        });

        it('should return the expected date', () => {
            const date = new Date('2020-01-01T12:00:00Z');
            expect(getEventsDayDateString(date)).toBe('mer., Jan 2020');
        });
    });
});
