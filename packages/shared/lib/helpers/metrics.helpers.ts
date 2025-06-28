import type { UserModel } from '../interfaces';
import { getUserCreationDate, getUserDaysSinceCreation } from '../user/helpers';

export const getAccountAgeForDimension = (user: UserModel) => {
    const daysSinceCreation = getUserDaysSinceCreation(getUserCreationDate(user));

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
