import { CYCLE } from '@proton/shared/lib/constants';
import { getPlanIDs } from '@proton/shared/lib/helpers/subscription';
import { PlanIDs } from '@proton/shared/lib/interfaces';
import { getSubscriptionMock } from '@proton/testing/data';

import { isSubscriptionUnchanged } from './helper';

describe('isSubscriptionUnchanged', () => {
    it('returns true when subscription and planIds are deeply equal', () => {
        const subscription = getSubscriptionMock();
        const planIds: PlanIDs = getPlanIDs(subscription); // Assuming getPlanIDs is a function that extracts plan IDs from a subscription

        const result = isSubscriptionUnchanged(subscription, planIds, 'EUR');
        expect(result).toBe(true);
    });

    it('returns false when subscription and planIds are not deeply equal', () => {
        const subscription = getSubscriptionMock();
        const planIds: PlanIDs = {
            mail2022: 1,
        };

        const result = isSubscriptionUnchanged(subscription, planIds, 'EUR');
        expect(result).toBe(false);
    });

    it('returns true when both subscription and planIds are empty', () => {
        const result = isSubscriptionUnchanged(null, {}, 'EUR');
        expect(result).toBe(true);
    });

    it('returns false when subscription is null and planIds is not null', () => {
        const planIds: PlanIDs = {
            bundle2022: 1,
        };

        const result = isSubscriptionUnchanged(null, planIds, 'EUR');
        expect(result).toBe(false);
    });

    it('returns false when subscription is not null and planIds is null', () => {
        const subscription = getSubscriptionMock();

        const result = isSubscriptionUnchanged(subscription, null as any, 'EUR');
        expect(result).toBe(false);
    });

    it('should return true when cycle is the same as in the subscription', () => {
        const subscription = getSubscriptionMock();
        subscription.Cycle = CYCLE.MONTHLY;

        const planIds: PlanIDs = getPlanIDs(subscription);

        const result = isSubscriptionUnchanged(subscription, planIds, 'EUR', CYCLE.MONTHLY);
        expect(result).toBe(true);
    });

    it('should return false when cycle is different from the subscription', () => {
        const subscription = getSubscriptionMock();
        subscription.Cycle = CYCLE.MONTHLY;

        const planIds: PlanIDs = getPlanIDs(subscription);

        const result = isSubscriptionUnchanged(subscription, planIds, 'EUR', CYCLE.YEARLY);
        expect(result).toBe(false);
    });

    it('should return false when currency is different from the subscription', () => {
        const subscription = getSubscriptionMock();
        subscription.Currency = 'EUR';

        const planIds: PlanIDs = getPlanIDs(subscription);

        const result = isSubscriptionUnchanged(subscription, planIds, 'USD');
        expect(result).toBe(false);
    });
});
