import { getUnixTime } from 'date-fns';

import { APPS, COUPON_CODES } from '@proton/shared/lib/constants';
import { ProtonConfig, Subscription, UserModel } from '@proton/shared/lib/interfaces';

import isEligible from './eligibility';

describe('BF 2023 Inbox offer for Free', () => {
    const protonConfig = { APP_NAME: APPS.PROTONMAIL } as ProtonConfig;
    const user = { isFree: true, isDelinquent: false, canPay: true } as UserModel;
    const pathname = '/u/1/mail/';

    beforeAll(() => {
        Object.defineProperty(window, 'location', {
            value: { pathname },
            writable: true,
        });
    });

    it('should be available for free account', () => {
        expect(isEligible({ user, protonConfig })).toBeTruthy();
        expect(isEligible({ user, protonConfig: { ...protonConfig, APP_NAME: APPS.PROTONCALENDAR } })).toBeTruthy();
        expect(isEligible({ user, protonConfig: { ...protonConfig, APP_NAME: APPS.PROTONACCOUNT } })).toBeTruthy();
    });

    it('should be available for trial account', () => {
        const subscription = { CouponCode: COUPON_CODES.REFERRAL } as Subscription;
        expect(isEligible({ user: { ...user, isPaid: true, isFree: false }, subscription, protonConfig })).toBeTruthy();
    });

    it('should not be available to downgrader', () => {
        const date = new Date(2023, 9, 2, 0, 0, 0); // October 2 2023 00:00:00 UTC
        const lastSubscriptionEnd = getUnixTime(date);
        expect(isEligible({ protonConfig, user, lastSubscriptionEnd })).toBeFalsy();
    });
});
