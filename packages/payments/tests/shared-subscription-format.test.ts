import { CYCLE, PLANS } from '@proton/shared/lib/payments/constants';
import type { Subscription } from '@proton/shared/lib/payments/subscription/interface';

import { formatSubscription } from '../core/api/api';
import { buildSubscription } from '../testing/buildSubscription';

describe('Subscription Format', () => {
    let subscription: Subscription;
    let upcoming: Subscription;

    beforeEach(() => {
        subscription = buildSubscription({ planName: PLANS.MAIL, cycle: CYCLE.MONTHLY, currency: 'CHF' });

        upcoming = buildSubscription({ planName: PLANS.MAIL, cycle: CYCLE.YEARLY, currency: 'CHF' });
    });

    it('should not add upcoming property if it is not specified', () => {
        const result = formatSubscription(subscription, undefined, undefined);
        expect(result.UpcomingSubscription).not.toBeDefined();
    });

    it('should add upcoming property if it is the second parameter', () => {
        const result = formatSubscription(subscription, upcoming, undefined);
        expect(result.UpcomingSubscription).toBeDefined();
    });

    it('should add SecondarySubscriptions property if it is the third parameter', () => {
        const secondarySubscription = buildSubscription();
        const result = formatSubscription(subscription, undefined, [secondarySubscription]);
        expect(result.SecondarySubscriptions).toEqual([secondarySubscription]);
    });
});
