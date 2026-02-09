import { format } from 'date-fns';
import { formatInTimeZone } from 'date-fns-tz';

import { dateLocale } from '@proton/shared/lib/i18n';
import { SETTINGS_DATE_FORMAT } from '@proton/shared/lib/interfaces';
import type { Meeting } from '@proton/shared/lib/interfaces/Meet';

export interface MeetingsByDay {
    [date: string]: Meeting[];
}

export const groupMeetingsByDay = (
    meetings: (Meeting & { adjustedStartTime: number; adjustedEndTime: number })[],
    groupBy: 'CreateTime' | 'adjustedStartTime' | 'adjustedEndTime' | 'LastUsedTime'
): MeetingsByDay => {
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

    return meetings.reduce((acc, meeting) => {
        // Skip meetings without a start time
        if (!meeting[groupBy]) {
            return acc;
        }

        // Convert the ISO string to a Date object and format in user's timezone
        const meetingDate = new Date(1000 * Number(meeting[groupBy]));

        // Extract the date portion (YYYY-MM-DD) in the user's timezone
        const date = formatInTimeZone(meetingDate, timezone, 'yyyy-MM-dd');

        if (!acc[date]) {
            acc[date] = [];
        }

        acc[date].push(meeting);

        return acc;
    }, {} as MeetingsByDay);
};

export const formatMeetingDate = (dateString: string, dateFormat: SETTINGS_DATE_FORMAT): string => {
    // Parse the YYYY-MM-DD date string
    const [year, month, day] = dateString.split('-').map(Number);
    const date = new Date(year, month - 1, day);

    if (dateFormat === SETTINGS_DATE_FORMAT.DDMMYYYY) {
        // Format the date as "19 January"
        return format(date, 'd MMMM', { locale: dateLocale });
    } else if (dateFormat === SETTINGS_DATE_FORMAT.MMDDYYYY || dateFormat === SETTINGS_DATE_FORMAT.YYYYMMDD) {
        // Format the date as "January 19"
        return format(date, 'MMMM d', { locale: dateLocale });
    }

    // Format according to locale
    return new Intl.DateTimeFormat(dateLocale.code, {
        month: 'long',
        day: 'numeric',
    }).format(date);
};
