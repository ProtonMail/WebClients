import { addDays, format } from 'date-fns';
import { formatInTimeZone, utcToZonedTime } from 'date-fns-tz';
import { c } from 'ttag';

import { dateLocale } from '@proton/shared/lib/i18n';
import { SETTINGS_DATE_FORMAT } from '@proton/shared/lib/interfaces';
import type { Meeting } from '@proton/shared/lib/interfaces/Meet';

export interface MeetingsByDay {
    [date: string]: Meeting[];
}

const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

export const groupMeetingsByDay = (
    meetings: (Meeting & { adjustedStartTime: number; adjustedEndTime: number })[],
    groupBy: 'CreateTime' | 'adjustedStartTime' | 'adjustedEndTime' | 'LastUsedTime'
): MeetingsByDay => {
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

const formatAbsoluteDate = (
    date: Date,
    year: number,
    isCurrentYear: boolean,
    dateFormat: SETTINGS_DATE_FORMAT
): string => {
    if (dateFormat === SETTINGS_DATE_FORMAT.DDMMYYYY) {
        // Format the date as "19 January" or "19 January, 2025"
        return format(date, `d MMMM${isCurrentYear ? '' : `, ${year}`}`, { locale: dateLocale });
    }

    if (dateFormat === SETTINGS_DATE_FORMAT.MMDDYYYY) {
        // Format the date as "January 19" or "January 19, 2025"
        return format(date, `MMMM d${isCurrentYear ? '' : `, ${year}`}`, { locale: dateLocale });
    }

    if (dateFormat === SETTINGS_DATE_FORMAT.YYYYMMDD) {
        // Format the date as "January 19" or "2025, January 19"
        return format(date, `${isCurrentYear ? '' : `${year}, `}MMMM d`, { locale: dateLocale });
    }

    // Format according to locale
    return new Intl.DateTimeFormat(dateLocale.code, {
        month: 'long',
        day: 'numeric',
        ...(isCurrentYear ? {} : { year: 'numeric' }),
    }).format(date);
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

    const absoluteDate = formatAbsoluteDate(date, year, isCurrentYear, dateFormat);

    if (!showRelativeDate) {
        return absoluteDate;
    }

    return getRelativeDate(dateString, absoluteDate) ?? absoluteDate;
};
