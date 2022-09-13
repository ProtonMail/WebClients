import { differenceInCalendarDays, fromUnixTime } from 'date-fns';

import { MB } from '@proton/shared/lib/drive/constants';

const EXTRA_STORAGE_GIFT_DAYS_LIMIT = 30;

export default function extraSpaceGift(user: { isFree: boolean; CreateTime: number; MaxSpace: number }) {
    const daysSinceAccountCreation = differenceInCalendarDays(new Date(), fromUnixTime(user.CreateTime));
    const remainingDays = Math.max(EXTRA_STORAGE_GIFT_DAYS_LIMIT - daysSinceAccountCreation, 0);

    const isApplicable =
        // Paid users already have bigger storage.
        user.isFree &&
        // We want to add it only to users with initial 500 GB storage.
        // Lets round it a bit up to accomodate power of two differences.
        user.MaxSpace <= 550 * MB &&
        // The bonus is only for new users (a month old).
        remainingDays > 0;

    return isApplicable ? remainingDays : 0;
}
