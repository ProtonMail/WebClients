import { getOccurrencesBetween } from '@proton/shared/lib/calendar/recurrence/recurring';
import { fromRruleString } from '@proton/shared/lib/calendar/vcal';
import { getDateTimeProperty } from '@proton/shared/lib/calendar/vcalConverter';
import { convertTimestampToTimezone, fromUTCDate } from '@proton/shared/lib/date/timezone';
import { type Meeting, MeetingType } from '@proton/shared/lib/interfaces/Meet';

export interface NextOccurrence {
    startTime: number;
    endTime: number;
}

/**
 * Calculates the next occurrence of a recurring meeting based on the current time.
 * For non-recurring meetings, returns the original start and end times.
 *
 * @param meeting - The meeting object containing StartTime, EndTime, and RRule
 * @returns An object containing startTime and endTime timestamps of the next occurrence
 */
export const getNextOccurrence = (meeting: Meeting): NextOccurrence => {
    // If there's no RRule, or it's not a recurring meeting, return the original start and end times
    if (!meeting.RRule || meeting.Type !== MeetingType.RECURRING || !meeting.StartTime) {
        return {
            startTime: Number(meeting.StartTime),
            endTime: meeting.EndTime ? Number(meeting.EndTime) : Number(meeting.StartTime) + 3600,
        };
    }

    try {
        // Parse the RRULE string
        const rruleValue = fromRruleString(meeting.RRule);
        if (!rruleValue) {
            return {
                startTime: Number(meeting.StartTime),
                endTime: meeting.EndTime ? Number(meeting.EndTime) : Number(meeting.StartTime) + 3600,
            };
        }

        // Create a minimal VEVENT component for recurrence calculation
        // Convert Unix timestamps to local time in the meeting's timezone
        const timezone = meeting.Timezone || 'UTC';
        const startDateTime = convertTimestampToTimezone(Number(meeting.StartTime), timezone);
        const endDateTime = meeting.EndTime
            ? convertTimestampToTimezone(Number(meeting.EndTime), timezone)
            : convertTimestampToTimezone(Number(meeting.StartTime) + 3600, timezone);

        const veventComponent = {
            component: 'vevent' as const,
            uid: {
                value: meeting.ID,
            },
            dtstamp: { value: { ...fromUTCDate(new Date()), isUTC: true } },
            dtstart: getDateTimeProperty(startDateTime, timezone),
            dtend: getDateTimeProperty(endDateTime, timezone),
            rrule: { value: rruleValue },
        };

        // Get the current time
        const now = new Date();
        const nowTimestamp = now.getTime();
        const futureTimestamp = nowTimestamp + 30 * 24 * 60 * 60 * 1000; // 1 month ahead

        // Get occurrences between now and 1 month ahead
        const occurrences = getOccurrencesBetween(veventComponent, nowTimestamp, futureTimestamp);

        if (occurrences.length > 0) {
            // Find the first occurrence that is >= now
            const nextOccurrence = occurrences.find((occurrence) =>
                occurrence.utcEnd
                    ? occurrence.utcEnd.getTime() > nowTimestamp
                    : occurrence.utcStart.getTime() + 3600 * 1000 > nowTimestamp
            );

            if (nextOccurrence) {
                return {
                    startTime: nextOccurrence.utcStart.getTime() / 1000,
                    endTime: nextOccurrence.utcEnd.getTime() / 1000,
                };
            }
        }

        // If no future occurrences found, return the original start and end times
        return {
            startTime: Number(meeting.StartTime),
            endTime: meeting.EndTime ? Number(meeting.EndTime) : Number(meeting.StartTime) + 3600,
        };
    } catch (error) {
        return {
            startTime: Number(meeting.StartTime),
            endTime: meeting.EndTime ? Number(meeting.EndTime) : Number(meeting.StartTime) + 3600,
        };
    }
};
