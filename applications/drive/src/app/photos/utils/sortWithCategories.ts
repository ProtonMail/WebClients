import { isThisMonth, isThisYear } from 'date-fns';
import { c } from 'ttag';

import { getMonthFormatter, getMonthYearFormatter } from '../../utils/intl/dateFormatter';
import type { PhotoItem } from '../usePhotos.store';

const dateToCategory = (date: Date): string => {
    if (isNaN(date.getTime())) {
        return c('Info').t`Unknown date`;
    }

    if (isThisMonth(date)) {
        return c('Info').t`This month`;
    } else if (isThisYear(date)) {
        return getMonthFormatter().format(date);
    }
    return getMonthYearFormatter().format(date);
};
export const sortWithCategories = (data: PhotoItem[]): (PhotoItem | string)[] => {
    const result: (PhotoItem | string)[] = [];
    let lastGroup = '';

    // Latest to oldest
    const sorted = [...data].sort((a, b) => b.captureTime.getTime() - a.captureTime.getTime());
    sorted.forEach((item) => {
        const group = dateToCategory(item.captureTime);

        if (group !== lastGroup) {
            lastGroup = group;
            result.push(group);
        }

        result.push(item);
    });

    return result;
};
