import { differenceInCalendarDays, format, isToday, isYesterday } from 'date-fns';
import { c } from 'ttag';

import { dateLocale } from '@proton/shared/lib/i18n';

export const formatChatRelativeDate = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const ageMs = Math.max(0, now.getTime() - date.getTime());
    const ageMinutes = Math.floor(ageMs / (1000 * 60));
    const ageHours = Math.floor(ageMs / (1000 * 60 * 60));

    if (ageMinutes < 1) {
        return c('collider_2025:Time').t`Just now`;
    }

    if (ageMinutes < 60) {
        return c('collider_2025:Time').t`${ageMinutes}m ago`;
    }

    if (isToday(date)) {
        return c('collider_2025:Time').t`${ageHours}h ago`;
    }

    if (isYesterday(date)) {
        return c('collider_2025: Date').t`Yesterday`;
    }

    if (differenceInCalendarDays(now, date) < 7) {
        return format(date, 'MMM d', { locale: dateLocale });
    }

    return format(date, 'MMM d', { locale: dateLocale });
};
