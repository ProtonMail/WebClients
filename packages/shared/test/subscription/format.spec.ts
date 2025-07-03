import { CYCLE, PLANS, type Subscription } from '@proton/payments';
import format from '@proton/shared/lib/subscription/format';
import { buildSubscription } from '@proton/testing/builders';

describe('Subscription Format', () => {
    let subscription: Subscription;
    let upcoming: Subscription;

    beforeEach(() => {
        subscription = buildSubscription({ planName: PLANS.MAIL, cycle: CYCLE.MONTHLY, currency: 'CHF' });

        upcoming = buildSubscription({ planName: PLANS.MAIL, cycle: CYCLE.YEARLY, currency: 'CHF' });
    });

    it('should not add upcoming property if it is not specified', () => {
        const result = format(subscription, undefined, undefined);
        expect(result.UpcomingSubscription).not.toBeDefined();
    });

    it('should add upcoming property if it is the second parameter', () => {
        const result = format(subscription, upcoming, undefined);
        expect(result.UpcomingSubscription).toBeDefined();
    });

    it('should add SecondarySubscriptions property if it is the third parameter', () => {
        const secondarySubscription = buildSubscription();
        const result = format(subscription, undefined, [secondarySubscription]);
        expect(result.SecondarySubscriptions).toEqual([secondarySubscription]);
    });
});
