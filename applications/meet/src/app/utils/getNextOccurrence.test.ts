import { beforeEach, describe, expect, it, vi } from 'vitest';

import { getOccurrencesBetween } from '@proton/shared/lib/calendar/recurrence/recurring';
import { fromRruleString } from '@proton/shared/lib/calendar/vcal';
import { getDateTimeProperty } from '@proton/shared/lib/calendar/vcalConverter';
import { convertTimestampToTimezone, fromUTCDate } from '@proton/shared/lib/date/timezone';
import type { Meeting } from '@proton/shared/lib/interfaces/Meet';
import { MeetingType } from '@proton/shared/lib/interfaces/Meet';

import { getNextOccurrence } from './getNextOccurrence';

vi.mock('@proton/shared/lib/calendar/recurrence/recurring', () => ({
    getOccurrencesBetween: vi.fn(),
}));

vi.mock('@proton/shared/lib/calendar/vcal', () => ({
    fromRruleString: vi.fn(),
}));

vi.mock('@proton/shared/lib/calendar/vcalConverter', () => ({
    getDateTimeProperty: vi.fn(),
}));

vi.mock('@proton/shared/lib/date/timezone', () => ({
    convertTimestampToTimezone: vi.fn(),
    fromUTCDate: vi.fn(),
}));

const mockGetOccurrencesBetween = vi.mocked(getOccurrencesBetween);
const mockFromRruleString = vi.mocked(fromRruleString);
const mockGetDateTimeProperty = vi.mocked(getDateTimeProperty);
const mockConvertTimestampToTimezone = vi.mocked(convertTimestampToTimezone);
const mockFromUTCDate = vi.mocked(fromUTCDate);

describe('getNextOccurrence', () => {
    // Base meeting object with only the properties needed by getNextOccurrence
    const baseMeeting: Partial<Meeting> = {
        ID: 'test-meeting',
        StartTime: '1640995200', // 2022-01-01 00:00:00 UTC
        EndTime: '1640998800', // 2022-01-01 01:00:00 UTC
        RRule: null,
        Timezone: 'UTC',
        Type: MeetingType.SCHEDULED,
    };

    beforeEach(() => {
        vi.clearAllMocks();

        // Setup default mocks - most tests return original StartTime
        mockFromRruleString.mockReturnValue(undefined); // This makes most tests return original StartTime
        mockGetOccurrencesBetween.mockReturnValue([]); // No occurrences found by default

        // Setup other default mocks
        mockGetDateTimeProperty.mockReturnValue({
            value: { year: 2024, month: 1, day: 1, hours: 0, minutes: 0, seconds: 0, isUTC: true },
            parameters: { tzid: 'UTC' },
        });

        mockConvertTimestampToTimezone.mockReturnValue({
            year: 2024,
            month: 1,
            day: 1,
            hours: 0,
            minutes: 0,
            seconds: 0,
        });

        mockFromUTCDate.mockReturnValue({
            year: 2024,
            month: 1,
            day: 1,
            hours: 0,
            minutes: 0,
            seconds: 0,
        });
    });

    it('should return original start time for non-recurring meetings', () => {
        const meeting = { ...baseMeeting } as Meeting;

        const result = getNextOccurrence(meeting);
        expect(result).toBe(1640995200);
    });

    it('should return original start time when RRule is null', () => {
        const meeting = { ...baseMeeting, Type: MeetingType.RECURRING } as Meeting;

        const result = getNextOccurrence(meeting);
        expect(result).toBe(1640995200);
    });

    it('should return original start time when StartTime is null', () => {
        const meeting = {
            ...baseMeeting,
            StartTime: null,
            RRule: 'FREQ=WEEKLY;BYDAY=MO',
            Type: MeetingType.RECURRING,
        } as Meeting;

        const result = getNextOccurrence(meeting);
        expect(result).toBe(0); // Number(null) returns 0, not NaN
    });

    it('should calculate next occurrence for recurring meetings', () => {
        const meeting = {
            ...baseMeeting,
            RRule: 'FREQ=WEEKLY;BYDAY=MO',
            Type: MeetingType.RECURRING,
        } as Meeting;

        // Mock the RRULE parsing
        mockFromRruleString.mockReturnValue({
            freq: 'WEEKLY',
            byday: ['MO'],
        });

        // Mock the next occurrence calculation
        const nextOccurrence = new Date('2024-01-08T00:00:00Z'); // Next Monday
        mockGetOccurrencesBetween.mockReturnValue([
            {
                localStart: nextOccurrence,
                localEnd: new Date('2024-01-08T01:00:00Z'),
                occurrenceNumber: 1,
                utcStart: nextOccurrence,
                utcEnd: new Date('2024-01-08T01:00:00Z'),
            },
        ]);

        const result = getNextOccurrence(meeting);
        expect(result).toBe(nextOccurrence.getTime() / 1000);

        // Verify the function was called with correct parameters
        expect(mockGetOccurrencesBetween).toHaveBeenCalledWith(
            expect.objectContaining({
                component: 'vevent',
                uid: { value: 'test-meeting' },
                rrule: { value: { freq: 'WEEKLY', byday: ['MO'] } },
            }),
            expect.any(Number), // nowTimestamp
            expect.any(Number) // futureTimestamp
        );
    });

    it('should fallback to original start time when RRULE parsing fails', () => {
        const meeting = {
            ...baseMeeting,
            RRule: 'INVALID_RRULE',
            Type: MeetingType.RECURRING,
        } as Meeting;

        const result = getNextOccurrence(meeting);
        expect(result).toBe(1640995200);
    });

    it('should handle meetings without end time', () => {
        const meeting = {
            ...baseMeeting,
            EndTime: null,
            RRule: 'FREQ=DAILY',
            Type: MeetingType.RECURRING,
        } as Meeting;

        mockFromRruleString.mockReturnValue({
            freq: 'DAILY',
        });

        const nextOccurrence = new Date('2024-01-02T00:00:00Z');
        mockGetOccurrencesBetween.mockReturnValue([
            {
                localStart: nextOccurrence,
                localEnd: new Date('2024-01-02T01:00:00Z'),
                occurrenceNumber: 1,
                utcStart: nextOccurrence,
                utcEnd: new Date('2024-01-02T01:00:00Z'),
            },
        ]);

        const result = getNextOccurrence(meeting);
        expect(result).toBe(nextOccurrence.getTime() / 1000);
    });

    it('should return original start time when no future occurrences are found', () => {
        const meeting = {
            ...baseMeeting,
            RRule: 'FREQ=WEEKLY;BYDAY=MO;COUNT=1',
            Type: MeetingType.RECURRING,
        } as Meeting;

        // Override default mock to return valid RRULE but no occurrences
        mockFromRruleString.mockReturnValue({
            freq: 'WEEKLY',
            byday: ['MO'],
            count: 1,
        });

        const result = getNextOccurrence(meeting);
        expect(result).toBe(1640995200);
    });

    it('should handle different timezone meetings', () => {
        const meeting = {
            ...baseMeeting,
            RRule: 'FREQ=WEEKLY;BYDAY=MO',
            Timezone: 'America/New_York',
            Type: MeetingType.RECURRING,
        } as Meeting;

        mockFromRruleString.mockReturnValue({
            freq: 'WEEKLY',
            byday: ['MO'],
        });

        const nextOccurrence = new Date('2024-01-08T00:00:00Z');
        mockGetOccurrencesBetween.mockReturnValue([
            {
                localStart: nextOccurrence,
                localEnd: new Date('2024-01-08T01:00:00Z'),
                occurrenceNumber: 1,
                utcStart: nextOccurrence,
                utcEnd: new Date('2024-01-08T01:00:00Z'),
            },
        ]);

        const result = getNextOccurrence(meeting);
        expect(result).toBe(nextOccurrence.getTime() / 1000);

        // Verify timezone conversion was called with correct timezone
        expect(mockConvertTimestampToTimezone).toHaveBeenCalledWith(1640995200, 'UTC');
    });

    it('should handle errors gracefully and return original start time', () => {
        const meeting = {
            ...baseMeeting,
            RRule: 'FREQ=WEEKLY;BYDAY=MO',
            Type: MeetingType.RECURRING,
        } as Meeting;

        // Override default mock to throw an error
        mockFromRruleString.mockImplementation(() => {
            throw new Error('RRULE parsing failed');
        });

        const result = getNextOccurrence(meeting);
        expect(result).toBe(1640995200);
    });

    it('should handle different RRULE frequencies', () => {
        const testCases = [
            {
                rrule: 'FREQ=DAILY',
                parsedRrule: { freq: 'DAILY' },
                description: 'daily recurrence',
            },
            {
                rrule: 'FREQ=WEEKLY;BYDAY=MO,WE,FR',
                parsedRrule: { freq: 'WEEKLY', byday: ['MO', 'WE', 'FR'] },
                description: 'weekly recurrence on specific days',
            },
            {
                rrule: 'FREQ=MONTHLY;BYMONTHDAY=1',
                parsedRrule: { freq: 'MONTHLY', bymonthday: [1] },
                description: 'monthly recurrence on first day',
            },
            {
                rrule: 'FREQ=YEARLY;BYMONTH=1;BYMONTHDAY=1',
                parsedRrule: { freq: 'YEARLY', bymonth: [1], bymonthday: [1] },
                description: 'yearly recurrence on January 1st',
            },
        ];

        testCases.forEach(({ rrule, parsedRrule }) => {
            const meeting = {
                ...baseMeeting,
                RRule: rrule,
                Type: MeetingType.RECURRING,
            } as Meeting;

            mockFromRruleString.mockReturnValue(parsedRrule);

            const nextOccurrence = new Date('2024-01-02T00:00:00Z');
            mockGetOccurrencesBetween.mockReturnValue([
                {
                    localStart: nextOccurrence,
                    localEnd: new Date('2024-01-02T01:00:00Z'),
                    occurrenceNumber: 1,
                    utcStart: nextOccurrence,
                    utcEnd: new Date('2024-01-02T01:00:00Z'),
                },
            ]);

            const result = getNextOccurrence(meeting);
            expect(result).toBe(nextOccurrence.getTime() / 1000);
        });
    });
});
