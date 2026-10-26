import { isToday, isYesterday } from 'date-fns';
import { c } from 'ttag';

import { formatIntlDate } from '@proton/shared/lib/date/formatIntlDate';

/** Formats a run's creation time for its breadcrumb and history row. */
export const getScheduleRunTimestampLabel = (createdAt: string): string => {
    const date = new Date(createdAt);
    const time = formatIntlDate(date, { timeStyle: 'short' });
    if (isToday(date)) {
        // translator: Scheduled task run timestamp. ${time} is the localized creation time, e.g. "10:02 AM".
        return c('collider_2025:Label').t`Today, ${time}`;
    }
    if (isYesterday(date)) {
        // translator: Scheduled task run timestamp. ${time} is the localized creation time, e.g. "10:02 AM".
        return c('collider_2025:Label').t`Yesterday, ${time}`;
    }
    return formatIntlDate(date, {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
    });
};
