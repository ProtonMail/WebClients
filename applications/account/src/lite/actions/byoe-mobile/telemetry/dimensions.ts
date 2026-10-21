import type { UserModel } from '@proton/shared/lib/interfaces/User';
import { getUserCreationDate, getUserDaysSinceCreation } from '@proton/shared/lib/user/helpers';

import type { BYOEMobileAudience, DaysSinceAccountCreation } from './events';

export const getDaysSinceAccountCreation = (user: UserModel): DaysSinceAccountCreation => {
    if (!user.CreateTime) {
        return 'n/a';
    }

    const days = getUserDaysSinceCreation(getUserCreationDate(user));
    if (days < 1) {
        return '0';
    }
    if (days <= 3) {
        return '01-03';
    }
    if (days <= 10) {
        return '04-10';
    }
    if (days <= 30) {
        return '11-30';
    }
    if (days <= 60) {
        return '31-60';
    }
    if (days <= 120) {
        return '61-120';
    }
    return '>120';
};

/** Returns undefined for B2B users: BYOE is not supported for them, so nothing must be reported. */
export const getBYOEMobileAudience = (user: UserModel, isB2B: boolean): BYOEMobileAudience | undefined => {
    if (isB2B) {
        return undefined;
    }
    return user.isFree ? 'free' : 'b2c';
};
