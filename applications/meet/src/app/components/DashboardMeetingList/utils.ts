import { addDays, format } from 'date-fns';
import { formatInTimeZone, utcToZonedTime } from 'date-fns-tz';
import { c } from 'ttag';

import { dateLocale } from '@proton/shared/lib/i18n';
import type { Meeting } from '@proton/shared/lib/interfaces/Meet';
import type { SETTINGS_DATE_FORMAT } from '@proton/shared/lib/interfaces/UserSettings';

import { getDateFormatPattern } from '../../utils/dateFormat';

export interface MeetingsByDay {
    [date: string]: Meeting[];
}

const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

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

const getRelativeDate = (dateString: string, absoluteDate: string): string | null => {
    const now = utcToZonedTime(new Date(), timezone);
    const todayStr = formatInTimeZone(new Date(), timezone, 'yyyy-MM-dd');
    const tomorrowStr = formatInTimeZone(addDays(now, 1), timezone, 'yyyy-MM-dd');
    const yesterdayStr = formatInTimeZone(addDays(now, -1), timezone, 'yyyy-MM-dd');

    if (dateString === todayStr) {
        return c('Info').t`Today — ${absoluteDate}`;
    }

    if (dateString === tomorrowStr) {
        return c('Info').t`Tomorrow — ${absoluteDate}`;
    }

    if (dateString === yesterdayStr) {
        return c('Info').t`Yesterday — ${absoluteDate}`;
    }

    return null;
};

const formatAbsoluteDate = (date: Date, isCurrentYear: boolean, dateFormat: SETTINGS_DATE_FORMAT): string => {
    const pattern = getDateFormatPattern(dateFormat, { month: 'MMMM', withYear: !isCurrentYear });
    return format(date, pattern, { locale: dateLocale });
};

export const formatMeetingDate = (
    dateString: string,
    dateFormat: SETTINGS_DATE_FORMAT,
    showRelativeDate: boolean = false
): string => {
    // Parse the YYYY-MM-DD date string
    const [year, month, day] = dateString.split('-').map(Number);
    const date = new Date(year, month - 1, day);

    const zonedNow = utcToZonedTime(new Date(), timezone);
    const currentYear = zonedNow.getFullYear();
    const isCurrentYear = year === currentYear;

    const absoluteDate = formatAbsoluteDate(date, isCurrentYear, dateFormat);

    if (!showRelativeDate) {
        return absoluteDate;
    }

    return getRelativeDate(dateString, absoluteDate) ?? absoluteDate;
};
