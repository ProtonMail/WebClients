import { format } from 'date-fns';

import { dateLocale } from '@proton/shared/lib/i18n';

import { getDaysFromMilliseconds, getDaysLeftLabel, getTriggerDelayLabel } from './helper';

export const getFormattedAccessibleAtDate = (date: Date | null) => {
    if (date === null) {
        return null;
    }
    return format(date, 'PP', { locale: dateLocale });
};

export const getFormattedCreateTime = (date: Date | null) => {
    if (date === null) {
        return null;
    }
    return format(date, 'PP', { locale: dateLocale });
};

export const getFormattedRemainingDays = (diff: number | null) => {
    if (diff === null) {
        return null;
    }
    return getDaysLeftLabel(getDaysFromMilliseconds(diff));
};

export const getFormattedTriggerDelay = (diff: number | null) => {
    if (diff === null) {
        return null;
    }
    return getTriggerDelayLabel(diff);
};
