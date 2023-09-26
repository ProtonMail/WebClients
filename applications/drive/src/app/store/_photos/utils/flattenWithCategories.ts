import { fromUnixTime, isThisYear, isToday } from 'date-fns';
import { c } from 'ttag';

import type { PhotoGridItem, PhotoLink } from '../interface';
import { getMonthFormatter, getMonthYearFormatter } from './dateFormatter';

const dateToCategory = (timestamp: number): string => {
    const date = fromUnixTime(timestamp);

    if (isToday(date)) {
        return c('Info').t`Today`;
    } else if (isThisYear(date)) {
        return getMonthFormatter().format(date);
    }

    return getMonthYearFormatter().format(date);
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
