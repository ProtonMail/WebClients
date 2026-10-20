import type { UserModel } from '@proton/shared/lib/interfaces/User';

import { TIME_PERIOD } from '../interface';

export const getDefaultTimePeriod = (user: UserModel) => {
    return user.hasPaidMail ? TIME_PERIOD.BIG_BANG : TIME_PERIOD.LAST_6_MONTHS;
};
