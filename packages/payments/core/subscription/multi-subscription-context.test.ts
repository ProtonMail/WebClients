import { buildSubscription } from '../../testing/buildSubscription';
import { FREE_SUBSCRIPTION, PLANS } from '../constants';
import type { Subscription } from './interface';
import { toSubscriptionList } from './multi-subscription-context';

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
