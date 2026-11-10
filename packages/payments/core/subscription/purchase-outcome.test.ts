import { SubscriptionPlatform } from '@proton/shared/lib/payments/subscription/constants';

import { buildLumoSubscription, buildMultiSubscriptionContext } from '../../testing/buildMultiSubscriptionContext';
import { buildSubscription } from '../../testing/buildSubscription';
import { PLANS } from '../constants';
import type { Subscription } from './interface';
import { getPurchaseOutcome } from './purchase-outcome';

const webMailPlus = buildSubscription(PLANS.MAIL);
const webLumoPlus = buildLumoSubscription(PLANS.LUMO);
const iosLumoPlus = buildLumoSubscription(PLANS.LUMO, { External: SubscriptionPlatform.iOS });

const getOutcome = (subscriptions: Subscription[], planName: PLANS) =>
    getPurchaseOutcome(buildMultiSubscriptionContext(subscriptions), { [planName]: 1 });

describe('getPurchaseOutcome', () => {
    it('creates a new subscription for a user without one', () => {
        expect(getOutcome([], PLANS.MAIL)).toEqual({ type: 'new-subscription' });
    });

    it('creates a new subscription for a plan that can run alongside', () => {
        expect(getOutcome([webMailPlus], PLANS.LUMO)).toEqual({ type: 'new-subscription' });
        expect(getOutcome([webLumoPlus], PLANS.MAIL)).toEqual({ type: 'new-subscription' });
        expect(getOutcome([iosLumoPlus], PLANS.MAIL)).toEqual({ type: 'new-subscription' });
    });

    it('replaces the subscription that grants a product of the new plan', () => {
        expect(getOutcome([webLumoPlus], PLANS.LUMO_ULTRA)).toEqual({ type: 'replaces', subscription: webLumoPlus });
        expect(getOutcome([webMailPlus, webLumoPlus], PLANS.LUMO_ULTRA)).toEqual({
            type: 'replaces',
            subscription: webLumoPlus,
        });
        expect(getOutcome([webMailPlus, webLumoPlus], PLANS.BUNDLE)).toEqual({
            type: 'replaces',
            subscription: webMailPlus,
        });
    });

    it('replaces the only web subscription with a plan of another product', () => {
        expect(getOutcome([webMailPlus], PLANS.PASS)).toEqual({ type: 'replaces', subscription: webMailPlus });
        expect(getOutcome([webMailPlus], PLANS.DUO)).toEqual({ type: 'replaces', subscription: webMailPlus });
    });

    it('refuses a plan of another product next to several subscriptions', () => {
        expect(getOutcome([webMailPlus, webLumoPlus], PLANS.VPN2024)).toEqual({ type: 'refused' });
    });

    it('refuses a plan that is not allowed next to the subscriptions it leaves running', () => {
        expect(getOutcome([webMailPlus, webLumoPlus], PLANS.DUO)).toEqual({ type: 'refused' });
    });

    it('refuses to replace a store subscription', () => {
        expect(getOutcome([iosLumoPlus], PLANS.LUMO_ULTRA)).toEqual({ type: 'refused' });
    });
});
