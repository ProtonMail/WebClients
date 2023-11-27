import { fromUnixTime, isThisMonth, isThisYear } from 'date-fns';
import { c } from 'ttag';

import type { PhotoGridItem, PhotoGroup, PhotoLink } from '../interface';
import { getMonthFormatter, getMonthYearFormatter } from './dateFormatter';

const dateToCategory = (timestamp: number): PhotoGroup => {
    if (timestamp < 0) {
        return c('Info').t`Unknown date`;
    }

    const date = fromUnixTime(timestamp);

    if (isThisMonth(date)) {
        return c('Info').t`This month`;
    } else if (isThisYear(date)) {
        return getMonthFormatter().format(date);
    }

    return getMonthYearFormatter().format(date);
};

// For sorting, we will try to obtain captureTime in the following order:
// captureTime (almost guaranteed to be there) -> createTime (if decrypted) -> negative date fallback
const captureTime = (link: PhotoLink) =>
    link.activeRevision?.photo?.captureTime || ('createTime' in link && link.createTime) || -1;

export const sortWithCategories = (data: PhotoLink[]): PhotoGridItem[] => {
    const result: PhotoGridItem[] = [];
    let lastGroup = '';

    // Latest to oldest
    data.sort((a, b) => captureTime(b) - captureTime(a));
    data.forEach((item) => {
        const group = dateToCategory(captureTime(item));

        if (group !== lastGroup) {
            lastGroup = group;
            result.push(group);
        }

        result.push(item);
    });

    return result;
};
