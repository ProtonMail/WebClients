import { buildSubscription } from '@proton/payments/testing/buildSubscription';

import { ADDON_NAMES, FREE_SUBSCRIPTION, PLANS } from '../../constants';
import { hasLumo, hasSomeAddonOrPlan } from './plan-matching';

describe('hasSomeAddonOrPlan', () => {
    it('matches a plan or addon in the subscription', () => {
        const subscription = buildSubscription({
            [PLANS.MAIL]: 1,
            [ADDON_NAMES.LUMO_MAIL]: 1,
        });

        expect(hasSomeAddonOrPlan(subscription, PLANS.MAIL)).toBe(true);
        expect(hasSomeAddonOrPlan(subscription, ADDON_NAMES.LUMO_MAIL)).toBe(true);
        expect(hasSomeAddonOrPlan(subscription, PLANS.LUMO)).toBe(false);
    });

    it('returns false for a free subscription', () => {
        expect(hasSomeAddonOrPlan(FREE_SUBSCRIPTION, PLANS.MAIL)).toBe(false);
    });
});

describe('hasLumo', () => {
    it('recognizes a Lumo subscription', () => {
        expect(hasLumo(buildSubscription(PLANS.LUMO))).toBe(true);
        expect(hasLumo(buildSubscription(PLANS.MAIL))).toBe(false);
    });
});
