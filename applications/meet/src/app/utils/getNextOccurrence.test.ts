import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { Meeting } from '@proton/shared/lib/interfaces/Meet';
import { MeetingType } from '@proton/shared/lib/interfaces/Meet';

import { getNextOccurrence } from './getNextOccurrence';

describe('getNextOccurrence', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    afterEach(() => {
        // Restore time
        vi.useRealTimers();
    });

    // Base meeting object with only the properties needed by getNextOccurrence
    const baseMeeting: Partial<Meeting> = {
        ID: 'test-meeting',
        StartTime: '1640995200', // 2022-01-01 00:00:00 UTC
        EndTime: '1640998800', // 2022-01-01 01:00:00 UTC
        RRule: null,
        Timezone: 'UTC',
        Type: MeetingType.SCHEDULED,
    };

    it('should return original start and end times for non-recurring meetings', () => {
        const meeting = { ...baseMeeting } as Meeting;

        const result = getNextOccurrence(meeting);
        expect(result).toEqual({
            startTime: 1640995200,
            endTime: 1640998800,
        });
    });

    it('should return original start and end times when RRule is null', () => {
        const meeting = { ...baseMeeting, Type: MeetingType.RECURRING } as Meeting;

        const result = getNextOccurrence(meeting);
        expect(result).toEqual({
            startTime: 1640995200,
            endTime: 1640998800,
        });
    });

    it('should return zero start time and fallback end time when StartTime is null', () => {
        const meeting = {
            ...baseMeeting,
            StartTime: null,
            RRule: 'FREQ=WEEKLY;BYDAY=MO',
            Type: MeetingType.RECURRING,
        } as Meeting;

        const result = getNextOccurrence(meeting);
        expect(result).toEqual({
            startTime: 0, // Number(null) returns 0, not NaN
            endTime: 1640998800,
        });
    });

    it('should calculate next occurrence for recurring meetings', () => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date('2024-01-02T00:00:00Z'));

        const meeting = {
            ...baseMeeting,
            StartTime: '1704067200', // 2024-01-01 00:00:00 UTC (Monday)
            EndTime: '1704070800', // 2024-01-01 01:00:00 UTC
            RRule: 'FREQ=WEEKLY;BYDAY=MO',
            Timezone: 'UTC',
            Type: MeetingType.RECURRING,
        } as Meeting;

        const result = getNextOccurrence(meeting);

        // Should return the next Monday occurrence (2024-01-08 00:00:00 UTC)
        expect(result).toEqual({
            startTime: 1704672000,
            endTime: 1704675600, // 2024-01-08 01:00:00 UTC
        });

        vi.useRealTimers();
    });

    it('should fallback to original start and end times when RRULE parsing fails', () => {
        // Use an RRULE that will fail during processing
        const meeting = {
            ...baseMeeting,
            RRule: '', // Empty RRULE string
            Type: MeetingType.RECURRING,
        } as Meeting;

        const result = getNextOccurrence(meeting);
        expect(result).toEqual({
            startTime: 1640995200,
            endTime: 1640998800,
        });
    });

    it('should handle meetings without end time', () => {
        // Mock current time to 2024-01-01 00:00:00 UTC
        vi.useFakeTimers();
        vi.setSystemTime(new Date('2024-01-01T01:00:00Z'));

        const meeting = {
            ...baseMeeting,
            StartTime: '1704067200', // 2024-01-01 00:00:00 UTC
            EndTime: null,
            RRule: 'FREQ=DAILY',
            Timezone: 'UTC',
            Type: MeetingType.RECURRING,
        } as Meeting;

        const result = getNextOccurrence(meeting);

        // Should return the next day occurrence (2024-01-02 00:00:00 UTC)
        // End time defaults to startTime + 3600 (1 hour)
        expect(result).toEqual({
            startTime: 1704153600,
            endTime: 1704157200, // 2024-01-02 01:00:00 UTC
        });

        vi.useRealTimers();
    });

    it('should return original start and end times when no future occurrences are found', () => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date('2030-01-01T00:00:00Z'));

        const meeting = {
            ...baseMeeting,
            StartTime: '1704067200',
            EndTime: '1704070800',
            RRule: 'FREQ=WEEKLY;BYDAY=MO;COUNT=1',
            Timezone: 'UTC',
            Type: MeetingType.RECURRING,
        } as Meeting;

        const result = getNextOccurrence(meeting);
        // No future occurrences, returns original start and end times
        expect(result).toEqual({
            startTime: 1704067200,
            endTime: 1704070800,
        });

        vi.useRealTimers();
    });

    it('should handle different timezone meetings', () => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date('2024-01-01T00:00:00Z'));

        const meeting = {
            ...baseMeeting,
            StartTime: '1704067200', // 2024-01-01 00:00:00 UTC = 2023-12-31 19:00:00 EST (Sunday)
            EndTime: '1704070800', // 2024-01-01 01:00:00 UTC
            RRule: 'FREQ=WEEKLY;BYDAY=MO',
            Timezone: 'America/New_York',
            Type: MeetingType.RECURRING,
        } as Meeting;

        const result = getNextOccurrence(meeting);

        // Should calculate next Monday in America/New_York timezone
        // Next Monday is 2024-01-08 00:00:00 in local time (2024-01-08 05:00:00 UTC in winter)
        expect(result.startTime).toBeGreaterThan(1704067200);
        expect(result.endTime).toBeGreaterThan(result.startTime);

        vi.useRealTimers();
    });

    it('should handle errors gracefully and return original start and end times', () => {
        const meeting = {
            ...baseMeeting,
            RRule: 'FREQ=DAILY;BYHOUR=99',
            Type: MeetingType.RECURRING,
        } as Meeting;

        const result = getNextOccurrence(meeting);
        expect(result).toEqual({
            startTime: 1640995200,
            endTime: 1640998800,
        });
    });

    describe('DST (Daylight Saving Time) handling', () => {
        it('should correctly handle DST transition from winter to summer', () => {
            // Mock current time to March 25, 2025 (before DST transition on March 30)
            vi.useFakeTimers();
            vi.setSystemTime(new Date('2025-04-01T00:00:00Z'));

            // Meeting: Tuesdays at 10:00 AM Europe/Brussels time
            // March 25 is before DST (GMT+1): 10:00 AM = 09:00 UTC
            // April 1 is after DST (GMT+2): 10:00 AM = 08:00 UTC
            const dstTransitionMeeting = {
                ...baseMeeting,
                StartTime: '1711357200', // 2025-03-25 09:00:00 UTC (10:00 AM GMT+1)
                EndTime: '1711360800', // 2025-03-25 10:00:00 UTC (11:00 AM GMT+1)
                RRule: 'FREQ=WEEKLY;BYDAY=TU',
                Timezone: 'Europe/Paris',
                Type: MeetingType.RECURRING,
            } as Meeting;

            const result = getNextOccurrence(dstTransitionMeeting);

            // Next Tuesday is April 1, 2025 at 10:00 AM local (08:00 UTC due to DST)
            expect(result).toEqual({
                startTime: 1743494400,
                endTime: 1743498000, // 2025-04-01 09:00:00 UTC (11:00 AM GMT+2)
            });

            vi.useRealTimers();
        });

        it('should correctly handle DST transition from summer to winter', () => {
            // Mock current time to October 21, 2025 (before DST transition on October 26)
            vi.useFakeTimers();
            vi.setSystemTime(new Date('2025-10-22T07:00:00Z'));

            // Meeting: Tuesdays at 10:00 AM Europe/Brussels time
            // October 21 is before DST end (GMT+2): 10:00 AM = 08:00 UTC
            // October 28 is after DST end (GMT+1): 10:00 AM = 09:00 UTC
            const dstTransitionMeeting = {
                ...baseMeeting,
                StartTime: '1729504800', // 2025-10-21 10:00:00 UTC (12:00 AM GMT+2)
                EndTime: '1729508400', // 2025-10-21 11:00:00 UTC (01:00 PM GMT+2)
                RRule: 'FREQ=WEEKLY;BYDAY=TU',
                Timezone: 'Europe/Paris',
                Type: MeetingType.RECURRING,
            } as Meeting;

            const result = getNextOccurrence(dstTransitionMeeting);

            // Next Tuesday is October 28, 2025 at 12:00 AM local (11:00 UTC after DST)
            expect(result).toEqual({
                startTime: 1761649200,
                endTime: 1761652800, // 2025-10-28 01:00:00 PM local (12:00 UTC GMT+1)
            });

            vi.useRealTimers();
        });
    });
});
