import { format } from 'date-fns';

import { dateLocale } from '@proton/shared/lib/i18n';

/**
 * @param timestamp in seconds
 * @returns null when there is no date to display
 */
export const formatReportDate = (timestamp?: number) => {
    if (!timestamp) {
        return null;
    }
    return format(timestamp * 1000, 'PPp', { locale: dateLocale });
};
