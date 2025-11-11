import { buildSubscription } from '@proton/testing/builders';
import { PLANS_MAP } from '@proton/testing/data';

import { ADDON_NAMES, PLANS } from '../constants';
import type { PlanIDs } from '../interface';
import { SubscriptionPlatform } from './constants';
import { getIsPlanTransitionForbidden } from './forbidden-plan-transition';

describe('forbidden plan transitions', () => {
    const plansMap = PLANS_MAP;

    it('should be forbidden going from legacy vpn to mail', () => {
        const subscription = buildSubscription(PLANS.VPN);
        const planIDs: PlanIDs = { [PLANS.MAIL]: 1 };
        const result = getIsPlanTransitionForbidden({ subscription, planIDs, plansMap });
        expect(result).toEqual({ type: 'plus-to-plus', newPlanName: PLANS.MAIL });
    });

    it('should be forbidden going from vpn to mail', () => {
        const subscription = buildSubscription(PLANS.VPN2024);
        const planIDs: PlanIDs = { [PLANS.MAIL]: 1 };
        const result = getIsPlanTransitionForbidden({ subscription, planIDs, plansMap });
        expect(result).toEqual({ type: 'plus-to-plus', newPlanName: PLANS.MAIL });
    });

    it('should be allowed going from pass to pass lifetime', () => {
        const subscription = buildSubscription(PLANS.PASS);
        const planIDs: PlanIDs = { [PLANS.PASS_LIFETIME]: 1 };
        const result = getIsPlanTransitionForbidden({ subscription, planIDs, plansMap });
        expect(result).toEqual(null);
    });

    it('should be allowed going from mail to pass lifetime', () => {
        const subscription = buildSubscription(PLANS.MAIL);
        const planIDs: PlanIDs = { [PLANS.PASS_LIFETIME]: 1 };
        const result = getIsPlanTransitionForbidden({ subscription, planIDs, plansMap });
        expect(result).toEqual(null);
    });

    it('should be allowed going from vpn to pass lifetime', () => {
        const subscription = buildSubscription(PLANS.VPN2024);
        const planIDs: PlanIDs = { [PLANS.PASS_LIFETIME]: 1 };
        const result = getIsPlanTransitionForbidden({ subscription, planIDs, plansMap });
        expect(result).toEqual(null);
    });

    it('should be allowed going from pass lifetime to mail', () => {
        const subscription = buildSubscription(PLANS.PASS_LIFETIME);
        const planIDs: PlanIDs = { [PLANS.MAIL]: 1 };
        const result = getIsPlanTransitionForbidden({ subscription, planIDs, plansMap });
        expect(result).toEqual(null);
    });

    it('should be forbidden going from mail to pass', () => {
        const subscription = buildSubscription(PLANS.MAIL);
        const planIDs: PlanIDs = { [PLANS.PASS]: 1 };
        const result = getIsPlanTransitionForbidden({ subscription, planIDs, plansMap });
        expect(result).toEqual({ type: 'plus-to-plus', newPlanName: PLANS.PASS });
    });

    it('should be forbidden going from drive to mail', () => {
        const subscription = buildSubscription(PLANS.DRIVE);
        const planIDs: PlanIDs = { [PLANS.MAIL]: 1 };
        const result = getIsPlanTransitionForbidden({ subscription, planIDs, plansMap });
        expect(result).toEqual({ type: 'plus-to-plus', newPlanName: PLANS.MAIL });
    });

    it('should be forbidden going from drive to vpn', () => {
        const subscription = buildSubscription(PLANS.DRIVE);
        const planIDs: PlanIDs = { [PLANS.VPN2024]: 1 };
        const result = getIsPlanTransitionForbidden({ subscription, planIDs, plansMap });
        expect(result).toEqual({ type: 'plus-to-plus', newPlanName: PLANS.VPN2024 });
    });

    it('should be allowed going from vpn to vpn', () => {
        const subscription = buildSubscription(PLANS.VPN2024);
        const planIDs: PlanIDs = { [PLANS.VPN2024]: 1 };
        const result = getIsPlanTransitionForbidden({ subscription, planIDs, plansMap });
        expect(result).toEqual(null);
    });

    it('should be allowed going from vpn to bundle', () => {
        const subscription = buildSubscription(PLANS.VPN2024);
        const planIDs: PlanIDs = { [PLANS.BUNDLE]: 1 };
        const result = getIsPlanTransitionForbidden({ subscription, planIDs, plansMap });
        expect(result).toEqual(null);
    });

    it('should be allowed going from legacy vpn to new vpn', () => {
        const subscription = buildSubscription(PLANS.VPN);
        const planIDs: PlanIDs = { [PLANS.VPN2024]: 1 };
        const result = getIsPlanTransitionForbidden({ subscription, planIDs, plansMap });
        expect(result).toEqual(null);
    });

    it('should be allowed going from vpn to vpn+pass bundle', () => {
        const subscription = buildSubscription(PLANS.VPN2024);
        const planIDs: PlanIDs = { [PLANS.VPN_PASS_BUNDLE]: 1 };
        const result = getIsPlanTransitionForbidden({ subscription, planIDs, plansMap });
        expect(result).toEqual(null);
    });

    it('should be allowed going from pass to vpn+pass bundle', () => {
        const subscription = buildSubscription(PLANS.VPN2024);
        const planIDs: PlanIDs = { [PLANS.VPN_PASS_BUNDLE]: 1 };
        const result = getIsPlanTransitionForbidden({ subscription, planIDs, plansMap });
        expect(result).toEqual(null);
    });

    it('should be allowed going from drive 200 gb to drive 1 tb', () => {
        const subscription = buildSubscription(PLANS.DRIVE);
        const planIDs: PlanIDs = { [PLANS.DRIVE_1TB]: 1 };
        const result = getIsPlanTransitionForbidden({ subscription, planIDs, plansMap });
        expect(result).toEqual(null);
    });

    it('should be allowed going from drive 1 tb to drive 200 gb', () => {
        const subscription = buildSubscription(PLANS.DRIVE_1TB);
        const planIDs: PlanIDs = { [PLANS.DRIVE]: 1 };
        const result = getIsPlanTransitionForbidden({ subscription, planIDs, plansMap });
        expect(result).toEqual(null);
    });

    it('should be forbidden going from legacy vpn plus to lumo plus', () => {
        const subscription = buildSubscription(PLANS.VPN);
        const planIDs: PlanIDs = { [PLANS.LUMO]: 1 };
        const result = getIsPlanTransitionForbidden({ subscription, planIDs, plansMap });
        expect(result).toEqual({
            type: 'lumo-plus',
            newPlanName: PLANS.VPN2024,
            newPlanIDs: { [PLANS.VPN2024]: 1, [ADDON_NAMES.LUMO_VPN2024]: 1 },
        });
    });

    it('should be forbidden going from vpn plus to lumo plus', () => {
        const subscription = buildSubscription(PLANS.VPN2024);
        const planIDs: PlanIDs = { [PLANS.LUMO]: 1 };
        const result = getIsPlanTransitionForbidden({ subscription, planIDs, plansMap });
        expect(result).toEqual({
            type: 'lumo-plus',
            newPlanName: PLANS.VPN2024,
            newPlanIDs: { [PLANS.VPN2024]: 1, [ADDON_NAMES.LUMO_VPN2024]: 1 },
        });
    });

    it('should be forbidden going from bundle pro to lumo plus', () => {
        const subscription = buildSubscription({
            [PLANS.BUNDLE_PRO_2024]: 1,
            [ADDON_NAMES.MEMBER_BUNDLE_PRO_2024]: 2,
            [ADDON_NAMES.LUMO_BUNDLE_PRO_2024]: 2,
        });
        const planIDs: PlanIDs = { [PLANS.LUMO]: 1 };
        const result = getIsPlanTransitionForbidden({ subscription, planIDs, plansMap });
        expect(result).toEqual({
            type: 'lumo-plus',
            newPlanName: PLANS.BUNDLE_PRO_2024,
            newPlanIDs: {
                [PLANS.BUNDLE_PRO_2024]: 1,
                [ADDON_NAMES.MEMBER_BUNDLE_PRO_2024]: 2,
                [ADDON_NAMES.LUMO_BUNDLE_PRO_2024]: 2,
            },
        });
    });

    it('should be allowed going from free to lumo plus', () => {
        const planIDs: PlanIDs = { [PLANS.LUMO]: 1 };
        const result = getIsPlanTransitionForbidden({ subscription: undefined, planIDs, plansMap });
        expect(result).toEqual(null);
    });

    it('should be allowed to go from lumo plus to another plus with lumo addon', () => {
        const subscription = buildSubscription(PLANS.LUMO);
        const planIDs: PlanIDs = { [PLANS.VPN2024]: 1, [ADDON_NAMES.LUMO_VPN2024]: 1 };
        const result = getIsPlanTransitionForbidden({ subscription, planIDs, plansMap });
        expect(result).toEqual(null);
    });

    it('should be forbidden to go from lumo plus to another plus without lumo addon', () => {
        const subscription = buildSubscription(PLANS.LUMO);

        expect(
            getIsPlanTransitionForbidden({
                subscription,
                planIDs: { [PLANS.VPN2024]: 1, [ADDON_NAMES.LUMO_VPN2024]: 0 },
                plansMap,
            })
        ).toEqual({ type: 'plus-to-plus', newPlanName: PLANS.VPN2024 });

        expect(
            getIsPlanTransitionForbidden({
                subscription,
                planIDs: { [PLANS.VPN2024]: 1 },
                plansMap,
            })
        ).toEqual({ type: 'plus-to-plus', newPlanName: PLANS.VPN2024 });
    });

    it('should be allowed to go from Lumo Plus on iOS to other Plus subscription on web (multi-subs)', () => {
        const subscription = buildSubscription(PLANS.LUMO, {
            External: SubscriptionPlatform.iOS,
        });

        const planIDs: PlanIDs = { [PLANS.VPN2024]: 1 };
        const result = getIsPlanTransitionForbidden({ subscription, planIDs, plansMap });
        expect(result).toEqual(null);
    });

    it('should be allowed to go from Lumo Plus on Android to other Plus subscription on web (multi-subs)', () => {
        const subscription = buildSubscription(PLANS.LUMO, {
            External: SubscriptionPlatform.Android,
        });

        const planIDs: PlanIDs = { [PLANS.VPN2024]: 1 };
        const result = getIsPlanTransitionForbidden({ subscription, planIDs, plansMap });
        expect(result).toEqual(null);
    });

    it('should warn about going from visionary to non-visionary plan (visionary downgrade)', () => {
        const subscription = buildSubscription(PLANS.VISIONARY);
        const planIDs: PlanIDs = { [PLANS.MAIL]: 1 };
        const result = getIsPlanTransitionForbidden({ subscription, planIDs, plansMap });
        expect(result).toEqual({ type: 'visionary-downgrade' });
    });

    it('should be allowed going from visionary to visionary plan', () => {
        const subscription = buildSubscription(PLANS.VISIONARY);
        const planIDs: PlanIDs = { [PLANS.VISIONARY]: 1 };
        const result = getIsPlanTransitionForbidden({ subscription, planIDs, plansMap });
        expect(result).toEqual(null);
    });
});
