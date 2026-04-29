import { ADDON_NAMES, CYCLE, FREE_SUBSCRIPTION, PLANS, SelectedPlan } from '@proton/payments';
import type { SubscriptionCheckForbiddenReason } from '@proton/payments/index';
import { buildSubscription } from '@proton/testing/builders';
import { getTestPlansMap } from '@proton/testing/data';

import { show30DaysMoneyBackGuarantee } from './show30DaysMoneyBackGuarantee';

const plansMap = getTestPlansMap('CHF');
const allowed: SubscriptionCheckForbiddenReason = { forbidden: false };
const forbidden: SubscriptionCheckForbiddenReason = { forbidden: true, reason: 'already-subscribed' };

const makeVpnPlan = () => new SelectedPlan({ [PLANS.VPN2024]: 1 }, plansMap, CYCLE.YEARLY, 'CHF');
const makeNonVpnPlan = () => new SelectedPlan({ [PLANS.MAIL]: 1 }, plansMap, CYCLE.YEARLY, 'CHF');

const baseInput = {
    plansMap,
    subscription: FREE_SUBSCRIPTION,
    paymentForbiddenReason: allowed,
    selectedPlan: makeVpnPlan(),
};

describe('show30DaysMoneyBackGuarantee', () => {
    it('returns true when a VPN plan is selected, payment is allowed, and upgrading from free', () => {
        expect(show30DaysMoneyBackGuarantee(baseInput)).toBe(true);
    });

    it('returns true when subscription is undefined', () => {
        expect(show30DaysMoneyBackGuarantee({ ...baseInput, subscription: undefined })).toBe(true);
    });

    it('returns true when upgrading from a non-VPN plan to a VPN plan', () => {
        const subscription = buildSubscription(PLANS.MAIL);
        expect(show30DaysMoneyBackGuarantee({ ...baseInput, subscription })).toBe(true);
    });

    it('returns false when selected plan is not a VPN plan', () => {
        expect(show30DaysMoneyBackGuarantee({ ...baseInput, selectedPlan: makeNonVpnPlan() })).toBe(false);
    });

    it('returns false when payment is forbidden', () => {
        expect(show30DaysMoneyBackGuarantee({ ...baseInput, paymentForbiddenReason: forbidden })).toBe(false);
    });

    it('returns false when modifying VPN addons on the same plan', () => {
        const subscription = buildSubscription({ planName: PLANS.VPN_BUSINESS, cycle: CYCLE.YEARLY, currency: 'CHF' });
        const selectedPlanWithAddon = new SelectedPlan(
            { [PLANS.VPN_BUSINESS]: 1, [ADDON_NAMES.IP_VPN_BUSINESS]: 2 },
            plansMap,
            CYCLE.YEARLY,
            'CHF'
        );
        expect(
            show30DaysMoneyBackGuarantee({
                plansMap,
                subscription,
                paymentForbiddenReason: allowed,
                selectedPlan: selectedPlanWithAddon,
            })
        ).toBe(false);
    });
});
