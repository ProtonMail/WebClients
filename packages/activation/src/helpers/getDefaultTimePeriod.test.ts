import { UserModel } from '@proton/shared/lib/interfaces';

import { TIME_PERIOD } from '../interface';
import { getDefaultTimePeriod } from './getDefaultTimePeriod';

describe('get getDefault time period', () => {
    it('Should return 3 month for free users', () => {
        const user: Partial<UserModel> = {
            hasPaidMail: false,
        };

        const timePeriod = getDefaultTimePeriod(user as UserModel);
        expect(timePeriod).toBe(TIME_PERIOD.LAST_3_MONTHS);
    });

    it('Should return big bang for free users', () => {
        const user: Partial<UserModel> = {
            hasPaidMail: true,
        };

        const timePeriod = getDefaultTimePeriod(user as UserModel);
        expect(timePeriod).toBe(TIME_PERIOD.BIG_BANG);
    });
});
