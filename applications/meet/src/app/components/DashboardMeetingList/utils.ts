import { c } from 'ttag';

import differenceInCalendarDays from '@proton/shared/lib/date-fns-utc/differenceInCalendarDays';
import { fromUTCDateToTimezone } from '@proton/shared/lib/date/timezone';
import type { Meeting } from '@proton/shared/lib/interfaces/Meet';
import type { SETTINGS_DATE_FORMAT } from '@proton/shared/lib/interfaces/UserSettings';

import { formatDateForSetting } from '../../utils/dateFormat';
import { formatInTimeZone, getDeviceTimeZone } from '../../utils/zonedTime';

export interface MeetingsByDay {
    [date: string]: Meeting[];
}

const timezone = getDeviceTimeZone();

export const groupMeetingsByDay = (
    meetings: (Meeting & { adjustedStartTime: number; adjustedEndTime: number })[],
    groupBy: 'CreateTime' | 'adjustedStartTime' | 'adjustedEndTime' | 'LastUsedTime'
): { meetingsByDay: MeetingsByDay; meetingsCount: number } => {
    let meetingsCount = 0;

    const meetingsByDay = meetings.reduce((acc, meeting) => {
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

        meetingsCount++;

        return acc;
    }, {} as MeetingsByDay);

    return {
        meetingsByDay,
        meetingsCount,
    };
};

const getRelativeDate = (dayAsUTC: Date, absoluteDate: string): string | null => {
    const nowWallClockAsUTC = fromUTCDateToTimezone(new Date(), timezone);
    const daysFromToday = differenceInCalendarDays(dayAsUTC, nowWallClockAsUTC);

    if (daysFromToday === 0) {
        return c('Info').t`Today — ${absoluteDate}`;
    }

    if (daysFromToday === 1) {
        return c('Info').t`Tomorrow — ${absoluteDate}`;
    }

    if (daysFromToday === -1) {
        return c('Info').t`Yesterday — ${absoluteDate}`;
    }

    return null;
};

const formatAbsoluteDate = (date: Date, isCurrentYear: boolean, dateFormat: SETTINGS_DATE_FORMAT): string =>
    formatDateForSetting(date, dateFormat, { month: 'long', withYear: !isCurrentYear });

export const formatMeetingDate = (
    dateString: string,
    dateFormat: SETTINGS_DATE_FORMAT,
    showRelativeDate: boolean = false
): string => {
    // Parse the YYYY-MM-DD date string
    const [year, month, day] = dateString.split('-').map(Number);
    const date = new Date(year, month - 1, day);

    const currentYear = fromUTCDateToTimezone(new Date(), timezone).getUTCFullYear();
    const isCurrentYear = year === currentYear;

    const absoluteDate = formatAbsoluteDate(date, isCurrentYear, dateFormat);

    if (!showRelativeDate) {
        return absoluteDate;
    }

    return getRelativeDate(new Date(Date.UTC(year, month - 1, day)), absoluteDate) ?? absoluteDate;
};
