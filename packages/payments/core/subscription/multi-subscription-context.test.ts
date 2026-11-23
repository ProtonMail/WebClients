import { SubscriptionPlatform } from '@proton/shared/lib/payments/subscription/constants';

import { buildLumoSubscription, buildMultiSubscriptionContext } from '../../testing/buildMultiSubscriptionContext';
import { buildSubscription } from '../../testing/buildSubscription';
import { FREE_SUBSCRIPTION, PLANS } from '../constants';
import type { Subscription } from './interface';
import { getSubscriptionWithPlan, toSubscriptionList } from './multi-subscription-context';

describe('toSubscriptionList', () => {
    it('should return no subscriptions for a free subscription', () => {
        expect(toSubscriptionList(FREE_SUBSCRIPTION as unknown as Subscription)).toEqual([]);
    });

    it('should return no subscriptions when there is no subscription', () => {
        expect(toSubscriptionList(undefined)).toEqual([]);
    });

    it('should return the only subscription of a single-subscription user', () => {
        const mailPro = buildSubscription(PLANS.MAIL_PRO);

        expect(toSubscriptionList(mailPro)).toEqual([{ ...mailPro, SecondarySubscriptions: undefined }]);
    });

    it('should flatten secondary subscriptions so that none of them is nested in another', () => {
        const lumo = buildSubscription(PLANS.LUMO);
        const vpn = buildSubscription(PLANS.VPN2024);
        const mailPro = buildSubscription(PLANS.MAIL_PRO, { SecondarySubscriptions: [lumo, vpn] });

        expect(toSubscriptionList(mailPro)).toEqual([
            { ...mailPro, SecondarySubscriptions: undefined },
            { ...lumo, SecondarySubscriptions: undefined },
            { ...vpn, SecondarySubscriptions: undefined },
        ]);
    });
});

describe('getSubscriptionWithPlan', () => {
    const webMailPlus = buildSubscription(PLANS.MAIL);
    const iosLumoPlus = buildLumoSubscription(PLANS.LUMO, { External: SubscriptionPlatform.iOS });
    const context = buildMultiSubscriptionContext([webMailPlus, iosLumoPlus]);

    it('should return the subscription whose plan is the given plan', () => {
        expect(getSubscriptionWithPlan(context, PLANS.MAIL)).toBe(webMailPlus);
    });

    it('should return a store subscription too, even though a web purchase cannot change it', () => {
        expect(getSubscriptionWithPlan(context, PLANS.LUMO)).toBe(iosLumoPlus);
    });

    it('should return nothing for a plan no subscription holds', () => {
        expect(getSubscriptionWithPlan(context, PLANS.BUNDLE)).toBeUndefined();
        expect(getSubscriptionWithPlan(buildMultiSubscriptionContext([]), PLANS.MAIL)).toBeUndefined();
    });
});
