import { fromUnixTime, isThisYear, isToday } from 'date-fns';
import { c } from 'ttag';

import { dateLocale } from '@proton/shared/lib/i18n';

import type { PhotoGridItem, PhotoLink } from '../interface';

const dateToCategory = (timestamp: number): string => {
    const date = fromUnixTime(timestamp);

    if (isToday(date)) {
        return c('Info').t`Today`;
    } else if (isThisYear(date)) {
        return new Intl.DateTimeFormat(dateLocale.code, { month: 'long' }).format(date);
    }

    return new Intl.DateTimeFormat(dateLocale.code, { month: 'long', year: 'numeric' }).format(date);
};

export const flattenWithCategories = (data: PhotoLink[]): PhotoGridItem[] => {
    const result: PhotoGridItem[] = [];
    let lastGroup = '';

    // Latest to oldest
    data.sort((a, b) => b.activeRevision.photo.captureTime - a.activeRevision?.photo?.captureTime);
    data.forEach((item) => {
        const group = dateToCategory(item.activeRevision.photo.captureTime);
        if (group !== lastGroup) {
            lastGroup = group;
            result.push(group);
        }

        result.push(item);
    });

    return result;
};
