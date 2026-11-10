import { SubscriptionPlatform } from '@proton/shared/lib/payments/subscription/constants';

import {
    buildLumoSubscription,
    buildMultiSubscriptionContext,
    buildMultiSubscriptionContextFromSubscription,
} from '../../testing/buildMultiSubscriptionContext';
import { buildSubscription } from '../../testing/buildSubscription';
import { PLANS_MAP } from '../../testing/data-plans';
import { ADDON_NAMES, PLANS } from '../constants';
import type { PlanIDs } from '../interface';
import { getIsPlanTransitionForbidden } from './forbidden-plan-transition';
import type { Subscription } from './interface';

describe('forbidden plan transitions', () => {
    const plansMap = PLANS_MAP;

    it('should be forbidden going from legacy vpn to mail', () => {
        const subscription = buildSubscription(PLANS.VPN);
        const planIDs: PlanIDs = { [PLANS.MAIL]: 1 };
        const result = getIsPlanTransitionForbidden({
            subscription,
            planIDs,
            plansMap,
            multiSubscriptionContext: buildMultiSubscriptionContextFromSubscription(undefined),
        });
        expect(result).toEqual({ type: 'plus-to-plus', newPlanName: PLANS.MAIL });
    });

    it('should be forbidden going from vpn to mail', () => {
        const subscription = buildSubscription(PLANS.VPN2024);
        const planIDs: PlanIDs = { [PLANS.MAIL]: 1 };
        const result = getIsPlanTransitionForbidden({
            subscription,
            planIDs,
            plansMap,
            multiSubscriptionContext: buildMultiSubscriptionContextFromSubscription(undefined),
        });
        expect(result).toEqual({ type: 'plus-to-plus', newPlanName: PLANS.MAIL });
    });

    it('should be allowed going from pass to pass lifetime', () => {
        const subscription = buildSubscription(PLANS.PASS);
        const planIDs: PlanIDs = { [PLANS.PASS_LIFETIME]: 1 };
        const result = getIsPlanTransitionForbidden({
            subscription,
            planIDs,
            plansMap,
            multiSubscriptionContext: buildMultiSubscriptionContextFromSubscription(undefined),
        });
        expect(result).toEqual(null);
    });

    it('should be allowed going from mail to pass lifetime', () => {
        const subscription = buildSubscription(PLANS.MAIL);
        const planIDs: PlanIDs = { [PLANS.PASS_LIFETIME]: 1 };
        const result = getIsPlanTransitionForbidden({
            subscription,
            planIDs,
            plansMap,
            multiSubscriptionContext: buildMultiSubscriptionContextFromSubscription(undefined),
        });
        expect(result).toEqual(null);
    });

    it('should be allowed going from vpn to pass lifetime', () => {
        const subscription = buildSubscription(PLANS.VPN2024);
        const planIDs: PlanIDs = { [PLANS.PASS_LIFETIME]: 1 };
        const result = getIsPlanTransitionForbidden({
            subscription,
            planIDs,
            plansMap,
            multiSubscriptionContext: buildMultiSubscriptionContextFromSubscription(undefined),
        });
        expect(result).toEqual(null);
    });

    it('should be allowed going from pass lifetime to mail', () => {
        const subscription = buildSubscription(PLANS.PASS_LIFETIME);
        const planIDs: PlanIDs = { [PLANS.MAIL]: 1 };
        const result = getIsPlanTransitionForbidden({
            subscription,
            planIDs,
            plansMap,
            multiSubscriptionContext: buildMultiSubscriptionContextFromSubscription(undefined),
        });
        expect(result).toEqual(null);
    });

    it('should be forbidden going from mail to pass', () => {
        const subscription = buildSubscription(PLANS.MAIL);
        const planIDs: PlanIDs = { [PLANS.PASS]: 1 };
        const result = getIsPlanTransitionForbidden({
            subscription,
            planIDs,
            plansMap,
            multiSubscriptionContext: buildMultiSubscriptionContextFromSubscription(undefined),
        });
        expect(result).toEqual({ type: 'plus-to-plus', newPlanName: PLANS.PASS });
    });

    it('should be forbidden going from drive to mail', () => {
        const subscription = buildSubscription(PLANS.DRIVE);
        const planIDs: PlanIDs = { [PLANS.MAIL]: 1 };
        const result = getIsPlanTransitionForbidden({
            subscription,
            planIDs,
            plansMap,
            multiSubscriptionContext: buildMultiSubscriptionContextFromSubscription(undefined),
        });
        expect(result).toEqual({ type: 'plus-to-plus', newPlanName: PLANS.MAIL });
    });

    it('should be forbidden going from drive to vpn', () => {
        const subscription = buildSubscription(PLANS.DRIVE);
        const planIDs: PlanIDs = { [PLANS.VPN2024]: 1 };
        const result = getIsPlanTransitionForbidden({
            subscription,
            planIDs,
            plansMap,
            multiSubscriptionContext: buildMultiSubscriptionContextFromSubscription(undefined),
        });
        expect(result).toEqual({ type: 'plus-to-plus', newPlanName: PLANS.VPN2024 });
    });

    it('should be allowed going from vpn to vpn', () => {
        const subscription = buildSubscription(PLANS.VPN2024);
        const planIDs: PlanIDs = { [PLANS.VPN2024]: 1 };
        const result = getIsPlanTransitionForbidden({
            subscription,
            planIDs,
            plansMap,
            multiSubscriptionContext: buildMultiSubscriptionContextFromSubscription(undefined),
        });
        expect(result).toEqual(null);
    });

    it('should be allowed going from vpn to bundle', () => {
        const subscription = buildSubscription(PLANS.VPN2024);
        const planIDs: PlanIDs = { [PLANS.BUNDLE]: 1 };
        const result = getIsPlanTransitionForbidden({
            subscription,
            planIDs,
            plansMap,
            multiSubscriptionContext: buildMultiSubscriptionContextFromSubscription(undefined),
        });
        expect(result).toEqual(null);
    });

    it('should be allowed going from legacy vpn to new vpn', () => {
        const subscription = buildSubscription(PLANS.VPN);
        const planIDs: PlanIDs = { [PLANS.VPN2024]: 1 };
        const result = getIsPlanTransitionForbidden({
            subscription,
            planIDs,
            plansMap,
            multiSubscriptionContext: buildMultiSubscriptionContextFromSubscription(undefined),
        });
        expect(result).toEqual(null);
    });

    it('should be allowed going from vpn to vpn+pass bundle', () => {
        const subscription = buildSubscription(PLANS.VPN2024);
        const planIDs: PlanIDs = { [PLANS.VPN_PASS_BUNDLE]: 1 };
        const result = getIsPlanTransitionForbidden({
            subscription,
            planIDs,
            plansMap,
            multiSubscriptionContext: buildMultiSubscriptionContextFromSubscription(undefined),
        });
        expect(result).toEqual(null);
    });

    it('should be allowed going from pass to vpn+pass bundle', () => {
        const subscription = buildSubscription(PLANS.VPN2024);
        const planIDs: PlanIDs = { [PLANS.VPN_PASS_BUNDLE]: 1 };
        const result = getIsPlanTransitionForbidden({
            subscription,
            planIDs,
            plansMap,
            multiSubscriptionContext: buildMultiSubscriptionContextFromSubscription(undefined),
        });
        expect(result).toEqual(null);
    });

    it('should be allowed going from drive 200 gb to drive 1 tb', () => {
        const subscription = buildSubscription(PLANS.DRIVE);
        const planIDs: PlanIDs = { [PLANS.DRIVE_1TB]: 1 };
        const result = getIsPlanTransitionForbidden({
            subscription,
            planIDs,
            plansMap,
            multiSubscriptionContext: buildMultiSubscriptionContextFromSubscription(undefined),
        });
        expect(result).toEqual(null);
    });

    it('should be allowed going from drive 1 tb to drive 200 gb', () => {
        const subscription = buildSubscription(PLANS.DRIVE_1TB);
        const planIDs: PlanIDs = { [PLANS.DRIVE]: 1 };
        const result = getIsPlanTransitionForbidden({
            subscription,
            planIDs,
            plansMap,
            multiSubscriptionContext: buildMultiSubscriptionContextFromSubscription(undefined),
        });
        expect(result).toEqual(null);
    });

    it('should be forbidden going from legacy vpn plus to lumo plus', () => {
        const subscription = buildSubscription(PLANS.VPN);
        const planIDs: PlanIDs = { [PLANS.LUMO]: 1 };
        const result = getIsPlanTransitionForbidden({
            subscription,
            planIDs,
            plansMap,
            multiSubscriptionContext: buildMultiSubscriptionContextFromSubscription(undefined),
        });
        expect(result).toEqual({
            type: 'lumo-plus',
            newPlanName: PLANS.VPN2024,
            newPlanIDs: { [PLANS.VPN2024]: 1, [ADDON_NAMES.LUMO_VPN2024]: 1 },
        });
    });

    it('should be forbidden going from vpn plus to lumo plus', () => {
        const subscription = buildSubscription(PLANS.VPN2024);
        const planIDs: PlanIDs = { [PLANS.LUMO]: 1 };
        const result = getIsPlanTransitionForbidden({
            subscription,
            planIDs,
            plansMap,
            multiSubscriptionContext: buildMultiSubscriptionContextFromSubscription(undefined),
        });
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
        const result = getIsPlanTransitionForbidden({
            subscription,
            planIDs,
            plansMap,
            multiSubscriptionContext: buildMultiSubscriptionContextFromSubscription(undefined),
        });
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
        const result = getIsPlanTransitionForbidden({
            subscription: undefined,
            planIDs,
            plansMap,
            multiSubscriptionContext: buildMultiSubscriptionContextFromSubscription(undefined),
        });
        expect(result).toEqual(null);
    });

    it('should be allowed to go from lumo plus to another plus with lumo addon', () => {
        const subscription = buildSubscription(PLANS.LUMO);
        const planIDs: PlanIDs = { [PLANS.VPN2024]: 1, [ADDON_NAMES.LUMO_VPN2024]: 1 };
        const result = getIsPlanTransitionForbidden({
            subscription,
            planIDs,
            plansMap,
            multiSubscriptionContext: buildMultiSubscriptionContextFromSubscription(undefined),
        });
        expect(result).toEqual(null);
    });

    it('should be forbidden to go from lumo plus to another plus without lumo addon', () => {
        const subscription = buildSubscription(PLANS.LUMO);

        expect(
            getIsPlanTransitionForbidden({
                subscription,
                planIDs: { [PLANS.VPN2024]: 1, [ADDON_NAMES.LUMO_VPN2024]: 0 },
                plansMap,
                multiSubscriptionContext: buildMultiSubscriptionContextFromSubscription(undefined),
            })
        ).toEqual({ type: 'plus-to-plus', newPlanName: PLANS.VPN2024 });

        expect(
            getIsPlanTransitionForbidden({
                subscription,
                planIDs: { [PLANS.VPN2024]: 1 },
                plansMap,
                multiSubscriptionContext: buildMultiSubscriptionContextFromSubscription(undefined),
            })
        ).toEqual({ type: 'plus-to-plus', newPlanName: PLANS.VPN2024 });
    });

    it('should be allowed to go from Lumo Plus on iOS to other Plus subscription on web (multi-subs)', () => {
        const subscription = buildSubscription(PLANS.LUMO, {
            External: SubscriptionPlatform.iOS,
        });

        const planIDs: PlanIDs = { [PLANS.VPN2024]: 1 };
        const result = getIsPlanTransitionForbidden({
            subscription,
            planIDs,
            plansMap,
            multiSubscriptionContext: buildMultiSubscriptionContextFromSubscription(undefined),
        });
        expect(result).toEqual(null);
    });

    it('should be allowed to go from Lumo Plus on Android to other Plus subscription on web (multi-subs)', () => {
        const subscription = buildSubscription(PLANS.LUMO, {
            External: SubscriptionPlatform.Android,
        });

        const planIDs: PlanIDs = { [PLANS.VPN2024]: 1 };
        const result = getIsPlanTransitionForbidden({
            subscription,
            planIDs,
            plansMap,
            multiSubscriptionContext: buildMultiSubscriptionContextFromSubscription(undefined),
        });
        expect(result).toEqual(null);
    });

    it('should be forbidden going from legacy vpn plus to meet plus', () => {
        const subscription = buildSubscription(PLANS.VPN);
        const planIDs: PlanIDs = { [PLANS.MEET]: 1 };
        const result = getIsPlanTransitionForbidden({
            subscription,
            planIDs,
            plansMap,
            multiSubscriptionContext: buildMultiSubscriptionContextFromSubscription(undefined),
        });
        expect(result).toEqual({
            type: 'meet-plus',
            newPlanName: PLANS.VPN2024,
            newPlanIDs: { [PLANS.VPN2024]: 1, [ADDON_NAMES.MEET_VPN2024]: 1 },
        });
    });

    it('should be forbidden going from vpn plus to meet plus', () => {
        const subscription = buildSubscription(PLANS.VPN2024);
        const planIDs: PlanIDs = { [PLANS.MEET]: 1 };
        const result = getIsPlanTransitionForbidden({
            subscription,
            planIDs,
            plansMap,
            multiSubscriptionContext: buildMultiSubscriptionContextFromSubscription(undefined),
        });
        expect(result).toEqual({
            type: 'meet-plus',
            newPlanName: PLANS.VPN2024,
            newPlanIDs: { [PLANS.VPN2024]: 1, [ADDON_NAMES.MEET_VPN2024]: 1 },
        });
    });

    it('should be forbidden going from mail plus to meet plus', () => {
        const subscription = buildSubscription(PLANS.MAIL);
        const planIDs: PlanIDs = { [PLANS.MEET]: 1 };
        const result = getIsPlanTransitionForbidden({
            subscription,
            planIDs,
            plansMap,
            multiSubscriptionContext: buildMultiSubscriptionContextFromSubscription(undefined),
        });
        expect(result).toEqual({
            type: 'meet-plus',
            newPlanName: PLANS.MAIL,
            newPlanIDs: { [PLANS.MAIL]: 1, [ADDON_NAMES.MEET_MAIL]: 1 },
        });
    });

    it('should be allowed going from free to meet plus', () => {
        const planIDs: PlanIDs = { [PLANS.MEET]: 1 };
        const result = getIsPlanTransitionForbidden({
            subscription: undefined,
            planIDs,
            plansMap,
            multiSubscriptionContext: buildMultiSubscriptionContextFromSubscription(undefined),
        });
        expect(result).toEqual(null);
    });

    it('should be allowed to go from meet plus to another plus with meet addon', () => {
        const subscription = buildSubscription(PLANS.MEET);
        const planIDs: PlanIDs = { [PLANS.VPN2024]: 1, [ADDON_NAMES.MEET_VPN2024]: 1 };
        const result = getIsPlanTransitionForbidden({
            subscription,
            planIDs,
            plansMap,
            multiSubscriptionContext: buildMultiSubscriptionContextFromSubscription(undefined),
        });
        expect(result).toEqual(null);
    });

    it('should auto-add meet addon when going from Meet Plus to VPN plus plan', () => {
        const subscription = buildSubscription(PLANS.MEET);
        expect(
            getIsPlanTransitionForbidden({
                subscription,
                planIDs: { [PLANS.VPN2024]: 1 },
                plansMap,
                multiSubscriptionContext: buildMultiSubscriptionContextFromSubscription(undefined),
            })
        ).toEqual({
            type: 'meet-plus',
            newPlanName: PLANS.VPN2024,
            newPlanIDs: { [PLANS.VPN2024]: 1, [ADDON_NAMES.MEET_VPN2024]: 1 },
        });
    });

    it('should auto-add meet addon when going from Meet Plus to Mail plus plan', () => {
        const subscription = buildSubscription(PLANS.MEET);
        expect(
            getIsPlanTransitionForbidden({
                subscription,
                planIDs: { [PLANS.MAIL]: 1 },
                plansMap,
                multiSubscriptionContext: buildMultiSubscriptionContextFromSubscription(undefined),
            })
        ).toEqual({
            type: 'meet-plus',
            newPlanName: PLANS.MAIL,
            newPlanIDs: { [PLANS.MAIL]: 1, [ADDON_NAMES.MEET_MAIL]: 1 },
        });
    });

    it('should auto-add meet addon when going from Meet Plus to Drive plus plan', () => {
        const subscription = buildSubscription(PLANS.MEET);
        expect(
            getIsPlanTransitionForbidden({
                subscription,
                planIDs: { [PLANS.DRIVE]: 1 },
                plansMap,
                multiSubscriptionContext: buildMultiSubscriptionContextFromSubscription(undefined),
            })
        ).toEqual({
            type: 'meet-plus',
            newPlanName: PLANS.DRIVE,
            newPlanIDs: { [PLANS.DRIVE]: 1, [ADDON_NAMES.MEET_DRIVE]: 1 },
        });
    });

    it('should auto-add meet addon when going from Meet Plus to Pass plus plan', () => {
        const subscription = buildSubscription(PLANS.MEET);
        expect(
            getIsPlanTransitionForbidden({
                subscription,
                planIDs: { [PLANS.PASS]: 1 },
                plansMap,
                multiSubscriptionContext: buildMultiSubscriptionContextFromSubscription(undefined),
            })
        ).toEqual({
            type: 'meet-plus',
            newPlanName: PLANS.PASS,
            newPlanIDs: { [PLANS.PASS]: 1, [ADDON_NAMES.MEET_PASS]: 1 },
        });
    });

    it('should be allowed to go from Meet Plus on iOS to other Plus subscription on web (multi-subs)', () => {
        const subscription = buildSubscription(PLANS.MEET, {
            External: SubscriptionPlatform.iOS,
        });
        const planIDs: PlanIDs = { [PLANS.VPN2024]: 1 };
        const result = getIsPlanTransitionForbidden({
            subscription,
            planIDs,
            plansMap,
            multiSubscriptionContext: buildMultiSubscriptionContextFromSubscription(undefined),
        });
        expect(result).toEqual(null);
    });

    it('should be allowed to go from Meet Plus on Android to other Plus subscription on web (multi-subs)', () => {
        const subscription = buildSubscription(PLANS.MEET, {
            External: SubscriptionPlatform.Android,
        });
        const planIDs: PlanIDs = { [PLANS.VPN2024]: 1 };
        const result = getIsPlanTransitionForbidden({
            subscription,
            planIDs,
            plansMap,
            multiSubscriptionContext: buildMultiSubscriptionContextFromSubscription(undefined),
        });
        expect(result).toEqual(null);
    });

    it('should warn about going from visionary to non-visionary plan (visionary downgrade)', () => {
        const subscription = buildSubscription(PLANS.VISIONARY);
        const planIDs: PlanIDs = { [PLANS.MAIL]: 1 };
        const result = getIsPlanTransitionForbidden({
            subscription,
            planIDs,
            plansMap,
            multiSubscriptionContext: buildMultiSubscriptionContextFromSubscription(undefined),
        });
        expect(result).toEqual({ type: 'visionary-downgrade' });
    });

    it('should be allowed going from visionary to visionary plan', () => {
        const subscription = buildSubscription(PLANS.VISIONARY);
        const planIDs: PlanIDs = { [PLANS.VISIONARY]: 1 };
        const result = getIsPlanTransitionForbidden({
            subscription,
            planIDs,
            plansMap,
            multiSubscriptionContext: buildMultiSubscriptionContextFromSubscription(undefined),
        });
        expect(result).toEqual(null);
    });
});

describe('forbidden plan transitions with the Lumo purchase rules', () => {
    const plansMap = {
        ...PLANS_MAP,
        [PLANS.LUMO_BASIC]: { ...PLANS_MAP[PLANS.LUMO]!, Name: PLANS.LUMO_BASIC },
        [PLANS.LUMO_ULTRA]: { ...PLANS_MAP[PLANS.LUMO]!, Name: PLANS.LUMO_ULTRA },
    };

    const getTransition = (subscription: Subscription, planIDs: PlanIDs, lumoMultiSubscriptions: boolean) => {
        return getIsPlanTransitionForbidden({
            subscription,
            planIDs,
            plansMap,
            multiSubscriptionContext: buildMultiSubscriptionContext([subscription], lumoMultiSubscriptions),
        });
    };

    it('lets a Mail Plus subscriber pick Lumo Plus only with the flag on', () => {
        const subscription = buildSubscription(PLANS.MAIL);

        expect(getTransition(subscription, { [PLANS.LUMO]: 1 }, false)).toEqual({
            type: 'lumo-plus',
            newPlanIDs: { [PLANS.MAIL]: 1, [ADDON_NAMES.LUMO_MAIL]: 1 },
            newPlanName: PLANS.MAIL,
        });
        expect(getTransition(subscription, { [PLANS.LUMO]: 1 }, true)).toEqual(null);
    });

    it.each([PLANS.LUMO_BASIC, PLANS.LUMO, PLANS.LUMO_ULTRA])(
        'gives a Family subscriber the Lumo addon instead of %s with the flag on',
        (planName) => {
            const subscription = buildSubscription(PLANS.FAMILY);

            expect(getTransition(subscription, { [planName]: 1 }, true)).toEqual({
                type: 'lumo-plus',
                newPlanIDs: { [PLANS.FAMILY]: 1, [ADDON_NAMES.LUMO_FAMILY]: 1 },
                newPlanName: PLANS.FAMILY,
            });
        }
    );

    it.each([PLANS.LUMO_BASIC, PLANS.LUMO_ULTRA])(
        'keeps %s untouched for a Family subscriber with the flag off',
        (planName) => {
            expect(getTransition(buildSubscription(PLANS.FAMILY), { [planName]: 1 }, false)).toEqual(null);
        }
    );

    it.each([PLANS.LUMO_BASIC, PLANS.LUMO, PLANS.LUMO_ULTRA])(
        'keeps the Lumo addon fallback for %s when Mail Plus already has the addon, with the flag on',
        (planName) => {
            const subscription = buildSubscription({ [PLANS.MAIL]: 1, [ADDON_NAMES.LUMO_MAIL]: 1 });

            expect(getTransition(subscription, { [planName]: 1 }, true)).toEqual({
                type: 'lumo-plus',
                newPlanIDs: { [PLANS.MAIL]: 1, [ADDON_NAMES.LUMO_MAIL]: 1 },
                newPlanName: PLANS.MAIL,
            });
        }
    );

    it('lets a web Lumo Plus subscriber move to Pass Plus only with the flag on', () => {
        const subscription = buildSubscription(PLANS.LUMO);

        expect(getTransition(subscription, { [PLANS.PASS]: 1 }, false)).toEqual({
            type: 'plus-to-plus',
            newPlanName: PLANS.PASS,
        });
        expect(getTransition(subscription, { [PLANS.PASS]: 1 }, true)).toEqual(null);
    });

    it('lets a web Lumo Basic subscriber move to Mail Plus with the flag on', () => {
        expect(getTransition(buildLumoSubscription(PLANS.LUMO_BASIC), { [PLANS.MAIL]: 1 }, true)).toEqual(null);
    });

    describe('with web Mail Plus and web Lumo Plus', () => {
        const webMailPlus = buildSubscription(PLANS.MAIL);
        const webLumoPlus = buildLumoSubscription(PLANS.LUMO);
        const context = buildMultiSubscriptionContext([webMailPlus, webLumoPlus]);

        const getTransitionFrom = (editedSubscription: Subscription, planIDs: PlanIDs) =>
            getIsPlanTransitionForbidden({
                subscription: editedSubscription,
                planIDs,
                plansMap,
                multiSubscriptionContext: context,
            });

        it.each([
            ['Mail Plus', webMailPlus],
            ['Lumo Plus', webLumoPlus],
        ])('allows Lumo Ultra, which replaces Lumo Plus, whichever subscription is edited (%s)', (_, edited) => {
            expect(getTransitionFrom(edited, { [PLANS.LUMO_ULTRA]: 1 })).toEqual(null);
        });
    });

    it('still forbids Mail Plus to Pass Plus with the flag on', () => {
        expect(getTransition(buildSubscription(PLANS.MAIL), { [PLANS.PASS]: 1 }, true)).toEqual({
            type: 'plus-to-plus',
            newPlanName: PLANS.PASS,
        });
    });
});
