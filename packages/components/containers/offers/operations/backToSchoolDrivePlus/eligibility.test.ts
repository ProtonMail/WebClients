import { APPS } from '@proton/shared/lib/constants';
import type { ProtonConfig, UserModel } from '@proton/shared/lib/interfaces';

import type { OfferConfig } from '../../interface';
import { getIsEligible } from './eligibility';

describe('backToSchoolDrivePlus eligibility', () => {
    it('accept free user', () => {
        const result = getIsEligible({
            user: {
                isPaid: false,
                canPay: true,
                isDelinquent: false,
            } as UserModel,
            protonConfig: {
                APP_NAME: APPS.PROTONDRIVE,
            } as ProtonConfig,
            offerConfig: {} as OfferConfig,
        });
        expect(result).toBe(true);
    });
});
