import {
    hasLumo,
    hasLumoBasic,
    hasLumoUltra,
    hasSomeAddonOrPlan,
} from '@proton/shared/lib/payments/subscription/helpers/plan-matching';

import { buildSubscription } from '../../../testing/buildSubscription';
import { ADDON_NAMES, FREE_SUBSCRIPTION, PLANS } from '../../constants';

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

const buildLumoSubscription = (planName: PLANS) => {
    const lumoPlusSubscription = buildSubscription(PLANS.LUMO);
    return {
        ...lumoPlusSubscription,
        Plans: lumoPlusSubscription.Plans.map((plan) => ({ ...plan, Name: planName })),
    };
};

describe('hasLumoBasic', () => {
    it('recognizes a Lumo Basic subscription only', () => {
        expect(hasLumoBasic(buildLumoSubscription(PLANS.LUMO_BASIC))).toBe(true);
        expect(hasLumoBasic(buildLumoSubscription(PLANS.LUMO))).toBe(false);
        expect(hasLumoBasic(buildLumoSubscription(PLANS.LUMO_ULTRA))).toBe(false);
        expect(hasLumoBasic(undefined)).toBe(false);
    });
});

describe('hasLumoUltra', () => {
    it('recognizes a Lumo Ultra subscription only', () => {
        expect(hasLumoUltra(buildLumoSubscription(PLANS.LUMO_ULTRA))).toBe(true);
        expect(hasLumoUltra(buildLumoSubscription(PLANS.LUMO))).toBe(false);
        expect(hasLumoUltra(buildLumoSubscription(PLANS.LUMO_BASIC))).toBe(false);
        expect(hasLumoUltra(undefined)).toBe(false);
    });
});
