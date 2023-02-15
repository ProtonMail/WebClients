import { UserModel } from '@proton/shared/lib/interfaces';

import { TIME_PERIOD } from '../interface';

export const getDefaultTimePeriod = (user: UserModel) => {
    return user.isFree ? TIME_PERIOD.LAST_3_MONTHS : TIME_PERIOD.BIG_BANG;
};
