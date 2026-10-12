import { differenceInCalendarDays, format, isToday, isYesterday } from 'date-fns';
import { c } from 'ttag';

import { dateLocale } from '@proton/shared/lib/i18n';

export const formatCreationEditedLabel = (date: Date): string => {
    const now = new Date();
    const ageMs = Math.max(0, now.getTime() - date.getTime());
    const ageMinutes = Math.floor(ageMs / (1000 * 60));
    const ageHours = Math.floor(ageMs / (1000 * 60 * 60));
    const ageDays = differenceInCalendarDays(now, date);

    if (ageMinutes < 1) {
        return c('collider_2025:Time').t`Edited just now`;
    }

    if (ageMinutes < 60) {
        return c('collider_2025:Time').t`Edited ${ageMinutes}m ago`;
    }

    if (isToday(date)) {
        return c('collider_2025:Time').t`Edited ${ageHours}h ago`;
    }

    if (isYesterday(date)) {
        return c('collider_2025:Time').t`Edited yesterday`;
    }

    if (ageDays < 7) {
        return c('collider_2025:Time').t`Edited ${ageDays}d ago`;
    }

    const formattedDate = format(date, 'MMM d', { locale: dateLocale });
    return c('collider_2025:Time').t`Edited ${formattedDate}`;
};
