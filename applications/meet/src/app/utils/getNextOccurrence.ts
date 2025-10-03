import { getOccurrencesBetween } from '@proton/shared/lib/calendar/recurrence/recurring';
import { fromRruleString } from '@proton/shared/lib/calendar/vcal';
import { getDateTimeProperty } from '@proton/shared/lib/calendar/vcalConverter';
import { convertTimestampToTimezone, fromUTCDate } from '@proton/shared/lib/date/timezone';
import { type Meeting, MeetingType } from '@proton/shared/lib/interfaces/Meet';

/**
 * Calculates the next occurrence of a recurring meeting based on the current time.
 * For non-recurring meetings, returns the original start time.
 *
 * @param meeting - The meeting object containing StartTime and RRule
 * @returns The timestamp of the next occurrence, or the original StartTime if not recurring
 */
export const getNextOccurrence = (meeting: Meeting): number => {
    // If there's no RRule, or it's not a recurring meeting, return the original start time
    if (!meeting.RRule || meeting.Type !== MeetingType.RECURRING || !meeting.StartTime) {
        return Number(meeting.StartTime);
    }

    try {
        // Parse the RRULE string
        const rruleValue = fromRruleString(meeting.RRule);
        if (!rruleValue) {
            return Number(meeting.StartTime);
        }

        // Create a minimal VEVENT component for recurrence calculation
        const veventComponent = {
            component: 'vevent' as const,
            uid: {
                value: meeting.ID,
            },
            dtstamp: { value: { ...fromUTCDate(new Date()), isUTC: true } },
            dtstart: getDateTimeProperty(
                convertTimestampToTimezone(Number(meeting.StartTime), 'UTC'),
                meeting.Timezone || 'UTC'
            ),
            dtend: getDateTimeProperty(
                convertTimestampToTimezone(
                    meeting.EndTime ? Number(meeting.EndTime) : Number(meeting.StartTime) + 3600,
                    'UTC'
                ),
                meeting.Timezone || 'UTC'
            ),
            rrule: { value: rruleValue },
        };

        // Get the current time
        const now = new Date();
        const nowTimestamp = now.getTime();
        const futureTimestamp = nowTimestamp + 30 * 24 * 60 * 60 * 1000; // 1 month ahead

        // Get occurrences between now and 1 month ahead
        const occurrences = getOccurrencesBetween(veventComponent, nowTimestamp, futureTimestamp);

        if (occurrences.length > 0) {
            // Return the timestamp of the next occurrence
            return occurrences[0].localStart.getTime() / 1000;
        }

        // If no future occurrences found, return the original start time
        return Number(meeting.StartTime);
    } catch (error) {
        return Number(meeting.StartTime);
    }
};
