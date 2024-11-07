import { differenceInDays, fromUnixTime } from 'date-fns';

import type { UserModel } from '../interfaces';

const today = new Date();
export const getAccountAgeForDimension = (user: UserModel) => {
    const daysSinceCreation = differenceInDays(today, fromUnixTime(user.CreateTime));

    if (daysSinceCreation <= 1) {
        return 'one day';
    }

    if (daysSinceCreation <= 7) {
        return 'one week';
    }

    if (daysSinceCreation <= 30) {
        return 'one month';
    }

    if (daysSinceCreation <= 365) {
        return 'one year';
    }

    return 'more';
};
