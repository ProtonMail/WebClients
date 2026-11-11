import { CustomPasswordState, type Meeting, MeetingType } from '@proton/shared/lib/interfaces/Meet';

import { combineDateAndTime, getEditValues, getInitialValues } from './utils';

describe('combineDateAndTime', () => {
    afterEach(() => {
        vi.unstubAllEnvs();
    });

    it('saves a Vancouver time after the move to permanent time at UTC-7', () => {
        expect(combineDateAndTime(new Date(2026, 10, 12), '10:00', 'America/Vancouver').toISOString()).toBe(
            '2026-11-12T17:00:00.000Z'
        );
    });

    it('saves an Edmonton time after the move to permanent time at UTC-6', () => {
        expect(combineDateAndTime(new Date(2026, 10, 12), '10:00', 'America/Edmonton').toISOString()).toBe(
            '2026-11-12T16:00:00.000Z'
        );
    });

    it('saves a Winnipeg time after the move to permanent time at UTC-5', () => {
        expect(combineDateAndTime(new Date(2026, 10, 12), '10:00', 'America/Winnipeg').toISOString()).toBe(
            '2026-11-12T15:00:00.000Z'
        );
    });

    it('returns an invalid date when the date field was cleared', () => {
        expect(Number.isNaN(combineDateAndTime(undefined, '10:00', 'America/Vancouver').getTime())).toBe(true);
    });

    describe('browser with outdated time zone rules', () => {
        it('saves a Vancouver 02:30 typed on the night the outdated rules move the clock forward', () => {
            vi.stubEnv('TZ', 'America/Los_Angeles');

            expect(combineDateAndTime(new Date(2027, 2, 14), '02:30', 'America/Vancouver').toISOString()).toBe(
                '2027-03-14T09:30:00.000Z'
            );
        });
    });
});

describe('getInitialValues', () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
        vi.unstubAllEnvs();
    });

    it('starts a new Vancouver meeting now and ends it 30 minutes later', () => {
        vi.setSystemTime(new Date('2026-11-12T17:05:00Z'));

        const { startDate, startTime, endTime, timeZone } = getInitialValues(false, 'America/Vancouver');

        expect(startTime).toBe('10:05');
        expect(endTime).toBe('10:35');
        expect(timeZone).toBe('America/Vancouver');
        expect(combineDateAndTime(startDate, startTime, 'America/Vancouver').toISOString()).toBe(
            '2026-11-12T17:05:00.000Z'
        );
    });

    it('starts a new Vancouver meeting on the Vancouver date just after midnight', () => {
        vi.stubEnv('TZ', 'America/Los_Angeles');
        vi.setSystemTime(new Date('2026-11-13T07:30:00Z'));

        const { startDate, startTime } = getInitialValues(false, 'America/Vancouver');

        expect([startDate.getFullYear(), startDate.getMonth() + 1, startDate.getDate()]).toEqual([2026, 11, 13]);
        expect(startTime).toBe('00:30');
    });

    it('ends a new Vancouver meeting opened just before midnight on the next Vancouver day', () => {
        vi.setSystemTime(new Date('2026-11-13T06:45:00Z'));

        const { startDate, startTime, endDate, endTime } = getInitialValues(false, 'America/Vancouver');

        expect(combineDateAndTime(startDate, startTime, 'America/Vancouver').toISOString()).toBe(
            '2026-11-13T06:45:00.000Z'
        );
        expect(combineDateAndTime(endDate, endTime, 'America/Vancouver').toISOString()).toBe(
            '2026-11-13T07:15:00.000Z'
        );
    });

    describe('browser with outdated time zone rules', () => {
        it('starts a new Vancouver meeting now on the night the outdated rules move the clock forward', () => {
            vi.stubEnv('TZ', 'America/Los_Angeles');
            vi.setSystemTime(new Date('2027-03-14T09:30:00Z'));

            const { startDate, startTime } = getInitialValues(false, 'America/Vancouver');

            expect(startTime).toBe('02:30');
            expect(combineDateAndTime(startDate, startTime, 'America/Vancouver').toISOString()).toBe(
                '2027-03-14T09:30:00.000Z'
            );
        });
    });
});

describe('getEditValues', () => {
    const createMeeting = (overrides: Partial<Meeting>): Meeting => ({
        ID: 'meeting-id',
        MeetingName: 'Weekly sync',
        MeetingLinkName: 'abcdefghij',
        Password: null,
        AddressID: null,
        Salt: 'salt',
        SessionKey: 'session-key',
        SRPModulusID: 'modulus-id',
        SRPSalt: 'srp-salt',
        SRPVerifier: 'srp-verifier',
        StartTime: String(Date.parse('2026-11-12T17:00:00Z') / 1000),
        EndTime: String(Date.parse('2026-11-12T17:30:00Z') / 1000),
        RRule: null,
        Timezone: null,
        Type: MeetingType.SCHEDULED,
        CustomPassword: CustomPasswordState.NO_PASSWORD,
        CreateTime: 0,
        LastUsedTime: null,
        ...overrides,
    });

    afterEach(() => {
        vi.unstubAllEnvs();
    });

    it('loads a Vancouver meeting in its own zone after the move to permanent time at UTC-7', () => {
        expect(getEditValues(createMeeting({ Timezone: 'America/Vancouver' }), false, 'Europe/Paris')).toEqual({
            meetingName: 'Weekly sync',
            timeZone: 'America/Vancouver',
            recurrence: 'NO_REPEAT',
            startDate: new Date(2026, 10, 12),
            startTime: '10:00',
            endDate: new Date(2026, 10, 12),
            endTime: '10:30',
        });
    });

    it('keeps an allowed zone that the bundled data stores as a link to another zone', () => {
        expect(getEditValues(createMeeting({ Timezone: 'Europe/Stockholm' }), false, 'Europe/Paris').timeZone).toBe(
            'Europe/Stockholm'
        );
    });

    it('loads a meeting in the user zone when its unknown zone contains the name of a known one', () => {
        expect(getEditValues(createMeeting({ Timezone: 'America/Westfield' }), false, 'Asia/Tokyo').timeZone).toBe(
            'Asia/Tokyo'
        );
    });

    it('loads a meeting saved with a legacy zone alias in the zone the backend accepts', () => {
        expect(getEditValues(createMeeting({ Timezone: 'Asia/Calcutta' }), false, 'Europe/Paris').timeZone).toBe(
            'Asia/Kolkata'
        );
    });

    it('loads a meeting in the user zone when the bundled data does not know its zone', () => {
        expect(getEditValues(createMeeting({ Timezone: 'Not/AZone' }), false, 'Asia/Tokyo')).toEqual({
            meetingName: 'Weekly sync',
            timeZone: 'Asia/Tokyo',
            recurrence: 'NO_REPEAT',
            startDate: new Date(2026, 10, 13),
            startTime: '02:00',
            endDate: new Date(2026, 10, 13),
            endTime: '02:30',
        });
    });

    describe('browser with outdated time zone rules', () => {
        it('loads a Vancouver meeting at its wall clock time after the move to permanent time at UTC-7', () => {
            vi.stubEnv('TZ', 'America/Los_Angeles');
            const vancouverMeeting = createMeeting({ Timezone: 'America/Vancouver' });

            expect(getEditValues(vancouverMeeting, false, 'America/Vancouver')).toEqual({
                meetingName: 'Weekly sync',
                timeZone: 'America/Vancouver',
                recurrence: 'NO_REPEAT',
                startDate: new Date(2026, 10, 12),
                startTime: '10:00',
                endDate: new Date(2026, 10, 12),
                endTime: '10:30',
            });
        });
    });
});
