import { format } from 'date-fns';

import { dateLocale } from '@proton/shared/lib/i18n';

import { getTriggerDelayLabel } from './helper';

export const getFormattedAccessibleAtDate = (date: Date | null) => {
    if (date === null) {
        return null;
    }
    return format(date, 'PPp', { locale: dateLocale });
};

export const getFormattedCreateTime = (date: Date | null) => {
    if (date === null) {
        return null;
    }
    return format(date, 'PP', { locale: dateLocale });
};

export const getFormattedTriggerDelay = (diff: number | null) => {
    if (diff === null) {
        return null;
    }
    return getTriggerDelayLabel(diff);
};
