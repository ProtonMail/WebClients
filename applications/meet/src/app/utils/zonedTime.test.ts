import { getTimezone } from '@proton/shared/lib/date/timezone';

import { formatInTimeZone, formatIntlInTimeZone, getDeviceTimeZone, isTimeZoneKnown } from './zonedTime';

const vancouverTimes = [
    {
        period: 'after the move to permanent time at UTC-7',
        formattedWallClock: '2026-11-12 10:00',
        instant: '2026-11-12T17:00:00.000Z',
    },
    {
        period: 'in summer time at UTC-7',
        formattedWallClock: '2026-07-01 10:00',
        instant: '2026-07-01T17:00:00.000Z',
    },
    {
        period: 'in standard time before the change at UTC-8',
        formattedWallClock: '2026-01-15 10:00',
        instant: '2026-01-15T18:00:00.000Z',
    },
];

describe('formatInTimeZone', () => {
    it.each(vancouverTimes)(
        'formats the Vancouver wall clock of an instant $period',
        ({ formattedWallClock, instant }) => {
            expect(formatInTimeZone(new Date(instant), 'America/Vancouver', 'yyyy-MM-dd HH:mm')).toBe(
                formattedWallClock
            );
        }
    );

    it('formats a timestamp in milliseconds', () => {
        expect(formatInTimeZone(Date.parse('2026-11-12T17:00:00Z'), 'America/Vancouver', 'HH:mm')).toBe('10:00');
    });
});

describe('formatIntlInTimeZone', () => {
    afterEach(() => {
        vi.unstubAllEnvs();
    });

    it('formats the Vancouver wall clock after the move to permanent time when the browser has the old rules', () => {
        vi.stubEnv('TZ', 'America/Los_Angeles');

        expect(
            formatIntlInTimeZone(
                Date.parse('2026-11-12T17:00:00Z'),
                'America/Vancouver',
                { hour: 'numeric', minute: '2-digit', hour12: true },
                'en-US'
            )
        ).toBe('10:00 AM');
    });
});

describe('isTimeZoneKnown', () => {
    it('returns true for a zone the bundled data knows', () => {
        expect(isTimeZoneKnown('America/Vancouver')).toBe(true);
    });

    it('returns false for a zone the bundled data does not know', () => {
        expect(isTimeZoneKnown('Not/AZone')).toBe(false);
    });
});

describe('getDeviceTimeZone', () => {
    afterEach(() => {
        vi.unstubAllEnvs();
        vi.restoreAllMocks();
    });

    it('returns the device zone when the backend list links it to a zone with another offset', () => {
        vi.stubEnv('TZ', 'America/Ciudad_Juarez');

        expect(getDeviceTimeZone()).toBe('America/Ciudad_Juarez');
    });

    it('returns the guessed zone when the bundled data does not know the device zone', () => {
        const deviceOptions = Intl.DateTimeFormat().resolvedOptions();
        vi.spyOn(Intl.DateTimeFormat.prototype, 'resolvedOptions').mockReturnValue({
            ...deviceOptions,
            timeZone: 'Etc/Unknown',
        });

        expect(getDeviceTimeZone()).toBe(getTimezone());
    });
});
