import { ADDON_NAMES, CYCLE, FREE_SUBSCRIPTION, PLANS } from '@proton/payments/core/constants';
import { buildSubscription } from '@proton/payments/testing/buildSubscription';
import { getTestPlansMap } from '@proton/payments/testing/data-plans';
import { APPS } from '@proton/shared/lib/constants';
import type { UserModel } from '@proton/shared/lib/interfaces/User';
import type { FreePlanDefault, Plan } from '@proton/shared/lib/payments/plan/interface';
import { SubscriptionPlatform } from '@proton/shared/lib/payments/subscription/constants';

import type { VisionaryUpsellLayout, VisionaryUpsellSubscriberPlan } from './helpers';
import {
    UNLIMITED_COMPARISON_ROWS,
    VISIONARY_COMPARISON_ROWS,
    getComparisonRows,
    getIsVisionaryUpsellEligible,
    getUpgradeWindowPrice,
    getVisionaryUpsellLayout,
    getVisionaryUpsellSubscriberPlan,
} from './helpers';

const plansMap = getTestPlansMap('EUR');
const visionaryPlan = plansMap[PLANS.VISIONARY];

const paidUser = { canPay: true, isFree: false, isPaid: true } as unknown as UserModel;
const memberUser = { canPay: false, isFree: false, isPaid: true } as unknown as UserModel;
const freeUser = { canPay: true, isFree: true, isPaid: false } as unknown as UserModel;

const freePlan = {
    MaxAddresses: 1,
    MaxBaseRewardSpace: 1024 ** 3,
    MaxDriveRewardSpace: 5 * 1024 ** 3,
} as FreePlanDefault;

const buildPlan = (pricing: { monthly: number; yearly: number }) =>
    ({
        Currency: 'EUR',
        Pricing: { [CYCLE.MONTHLY]: pricing.monthly, [CYCLE.YEARLY]: pricing.yearly },
    }) as unknown as Plan;

describe('getIsVisionaryUpsellEligible', () => {
    const isEligible = ({
        subscription = buildSubscription(PLANS.VPN2024),
        user = paidUser,
        app = APPS.PROTONVPN_SETTINGS,
        plan = visionaryPlan,
    }: Partial<{
        subscription: Parameters<typeof getIsVisionaryUpsellEligible>[0]['subscription'];
        user: UserModel;
        app: typeof APPS.PROTONVPN_SETTINGS | typeof APPS.PROTONMAIL;
        plan: Plan | undefined;
    }> = {}) => getIsVisionaryUpsellEligible({ app, user, subscription, visionaryPlan: plan });

    it.each([PLANS.VPN2024, PLANS.VPN, PLANS.VPN_PASS_BUNDLE, PLANS.BUNDLE, PLANS.DUO, PLANS.FAMILY])(
        'is eligible with a single %s subscription',
        (plan) => {
            expect(isEligible({ subscription: buildSubscription(plan) })).toBe(true);
        }
    );

    it('is eligible with VPN Plus and the Lumo or Meet add-on', () => {
        expect(
            isEligible({ subscription: buildSubscription({ [PLANS.VPN2024]: 1, [ADDON_NAMES.LUMO_VPN2024]: 1 }) })
        ).toBe(true);
        expect(
            isEligible({ subscription: buildSubscription({ [PLANS.VPN2024]: 1, [ADDON_NAMES.MEET_VPN2024]: 1 }) })
        ).toBe(true);
    });

    it('is eligible whatever the billing period', () => {
        [CYCLE.MONTHLY, CYCLE.YEARLY, CYCLE.TWO_YEARS].forEach((cycle) => {
            expect(
                isEligible({
                    subscription: buildSubscription({ planName: PLANS.BUNDLE, cycle, currency: 'EUR' }),
                })
            ).toBe(true);
        });
    });

    it('is not eligible outside of the VPN dashboard', () => {
        expect(isEligible({ app: APPS.PROTONMAIL })).toBe(false);
    });

    it('is not eligible for free users', () => {
        expect(isEligible({ user: freeUser, subscription: FREE_SUBSCRIPTION })).toBe(false);
    });

    it('is not eligible for members who cannot pay', () => {
        expect(isEligible({ user: memberUser })).toBe(false);
    });

    it('is not eligible with Visionary', () => {
        expect(isEligible({ subscription: buildSubscription(PLANS.VISIONARY) })).toBe(false);
    });

    it.each([PLANS.MAIL, PLANS.PASS, PLANS.DRIVE, PLANS.VPN_BUSINESS, PLANS.BUNDLE_PRO_2024])(
        'is not eligible with %s',
        (plan) => {
            expect(isEligible({ subscription: buildSubscription(plan) })).toBe(false);
        }
    );

    it.each([SubscriptionPlatform.iOS, SubscriptionPlatform.Android])(
        'is not eligible when billed by the app store (%s)',
        (External) => {
            expect(isEligible({ subscription: buildSubscription(PLANS.VPN2024, { External }) })).toBe(false);
        }
    );

    it('is not eligible with a second subscription', () => {
        const subscription = buildSubscription(PLANS.VPN2024, {
            SecondarySubscriptions: [buildSubscription(PLANS.LUMO)],
        });
        expect(isEligible({ subscription })).toBe(false);
    });

    it('is not eligible when the plans service has no Visionary plan or price', () => {
        expect(
            getIsVisionaryUpsellEligible({
                app: APPS.PROTONVPN_SETTINGS,
                user: paidUser,
                subscription: buildSubscription(PLANS.VPN2024),
                visionaryPlan: undefined,
            })
        ).toBe(false);
        expect(isEligible({ plan: buildPlan({ monthly: 0, yearly: 35988 }) })).toBe(false);
        expect(isEligible({ plan: buildPlan({ monthly: 3999, yearly: 0 }) })).toBe(false);
    });
});

describe('getVisionaryUpsellSubscriberPlan', () => {
    it.each([
        [PLANS.VPN2024, 'vpnPlus'],
        [PLANS.VPN, 'vpnPlus'],
        [PLANS.VPN_PASS_BUNDLE, 'vpnPassBundle'],
        [PLANS.BUNDLE, 'unlimited'],
        [PLANS.DUO, 'duo'],
        [PLANS.FAMILY, 'family'],
        [PLANS.MAIL, undefined],
    ])('maps %s to %s', (plan, expected) => {
        expect(getVisionaryUpsellSubscriberPlan(buildSubscription(plan))).toBe(expected);
    });
});

describe('getVisionaryUpsellLayout', () => {
    const matrix: [VisionaryUpsellSubscriberPlan, CYCLE, VisionaryUpsellLayout][] = [
        ['vpnPlus', CYCLE.MONTHLY, 'cycleDealsThenCompactPair'],
        ['vpnPlus', CYCLE.YEARLY, 'fullPair'],
        ['vpnPlus', CYCLE.TWO_YEARS, 'fullPair'],
        ['vpnPlus', CYCLE.FIFTEEN, 'cycleDealsThenCompactPair'],
        ['vpnPlus', CYCLE.THIRTY, 'cycleDealsThenCompactPair'],
        ['vpnPassBundle', CYCLE.MONTHLY, 'fullPair'],
        ['vpnPassBundle', CYCLE.YEARLY, 'fullPair'],
        ['vpnPassBundle', CYCLE.TWO_YEARS, 'fullPair'],
        ['unlimited', CYCLE.MONTHLY, 'ownOfferThenVisionary'],
        ['unlimited', CYCLE.YEARLY, 'groupOfferPair'],
        ['unlimited', CYCLE.TWO_YEARS, 'groupOfferPair'],
        ['duo', CYCLE.MONTHLY, 'ownOfferThenVisionary'],
        ['duo', CYCLE.YEARLY, 'groupOfferPair'],
        ['duo', CYCLE.TWO_YEARS, 'groupOfferPair'],
        ['family', CYCLE.MONTHLY, 'ownOfferThenVisionary'],
        ['family', CYCLE.YEARLY, 'ownOfferThenVisionary'],
        ['family', CYCLE.TWO_YEARS, 'ownOfferThenVisionary'],
    ];

    it.each(matrix)('%s on %i months shows %s', (subscriberPlan, cycle, expected) => {
        expect(getVisionaryUpsellLayout(subscriberPlan, cycle)).toBe(expected);
    });
});

describe('getUpgradeWindowPrice', () => {
    it('computes the Unlimited window price', () => {
        expect(getUpgradeWindowPrice(buildPlan({ monthly: 1299, yearly: 11988 }))).toEqual({
            currency: 'EUR',
            pricePerMonth: 999,
            monthlyPrice: 1299,
            yearlyTotal: 11988,
            discountPercent: 23,
        });
    });

    it('computes the Visionary window price', () => {
        expect(getUpgradeWindowPrice(buildPlan({ monthly: 3999, yearly: 35988 }))).toEqual({
            currency: 'EUR',
            pricePerMonth: 2999,
            monthlyPrice: 3999,
            yearlyTotal: 35988,
            discountPercent: 25,
        });
    });

    it('returns nothing without the monthly or 12-month price', () => {
        expect(getUpgradeWindowPrice(undefined)).toBeUndefined();
        expect(getUpgradeWindowPrice(buildPlan({ monthly: 0, yearly: 11988 }))).toBeUndefined();
        expect(getUpgradeWindowPrice(buildPlan({ monthly: 1299, yearly: 0 }))).toBeUndefined();
    });
});

describe('getComparisonRows', () => {
    it('lists the Visionary rows in order', () => {
        const rows = getComparisonRows({
            offeredPlanName: PLANS.VISIONARY,
            subscriberPlan: 'vpnPlus',
            subscription: buildSubscription(PLANS.VPN2024),
            currentPlan: plansMap[PLANS.VPN2024],
            offeredPlan: visionaryPlan,
            freePlan,
        });

        expect(rows.map(({ id }) => id)).toEqual([
            'ultra-servers',
            'premium-apps',
            'meet-professional',
            'lumo-plus',
            'scribe',
            'new-services',
            'early-access',
            'storage',
            'vpn-devices',
            'sentinel',
            'users',
            'addresses',
            'domains',
        ]);
        expect(rows.map(({ id }) => id)).toEqual(VISIONARY_COMPARISON_ROWS);
    });

    it('lists the Unlimited rows in order', () => {
        const rows = getComparisonRows({
            offeredPlanName: PLANS.BUNDLE,
            subscriberPlan: 'vpnPlus',
            subscription: buildSubscription(PLANS.VPN2024),
            currentPlan: plansMap[PLANS.VPN2024],
            offeredPlan: plansMap[PLANS.BUNDLE],
            freePlan,
        });

        expect(rows.map(({ id }) => id)).toEqual(UNLIMITED_COMPARISON_ROWS);
    });

    it('marks what Visionary adds over the current plan', () => {
        const rows = getComparisonRows({
            offeredPlanName: PLANS.VISIONARY,
            subscriberPlan: 'unlimited',
            subscription: buildSubscription(PLANS.BUNDLE),
            currentPlan: plansMap[PLANS.BUNDLE],
            offeredPlan: visionaryPlan,
            freePlan,
        });
        const byId = Object.fromEntries(rows.map((row) => [row.id, row]));

        expect(byId['ultra-servers']).toMatchObject({ current: false, offered: true });
        expect(byId['premium-apps']).toMatchObject({ current: true, offered: true });
        expect(byId.sentinel).toMatchObject({ current: true, offered: true });
        expect(byId['early-access']).toMatchObject({ current: false, offered: true });
        expect(byId['ultra-servers'].tooltip).toBeTruthy();
    });

    it('takes the add-ons of the current plan into account', () => {
        const rows = getComparisonRows({
            offeredPlanName: PLANS.VISIONARY,
            subscriberPlan: 'vpnPlus',
            subscription: buildSubscription({ [PLANS.VPN2024]: 1, [ADDON_NAMES.LUMO_VPN2024]: 1 }),
            currentPlan: plansMap[PLANS.VPN2024],
            offeredPlan: visionaryPlan,
            freePlan,
        });
        const byId = Object.fromEntries(rows.map((row) => [row.id, row]));

        expect(byId['lumo-plus'].current).toBe(true);
        expect(byId['meet-professional'].current).toBe(false);
    });

    it('takes the limits from the plans service', () => {
        const rows = getComparisonRows({
            offeredPlanName: PLANS.VISIONARY,
            subscriberPlan: 'vpnPlus',
            subscription: buildSubscription(PLANS.VPN2024),
            currentPlan: plansMap[PLANS.VPN2024],
            offeredPlan: { ...visionaryPlan, MaxAddresses: 100, MaxDomains: 10, MaxMembers: 6, MaxVPN: 60 } as Plan,
            freePlan,
        });
        const byId = Object.fromEntries(rows.map((row) => [row.id, row]));

        expect(byId.addresses.offered).toBe('100');
        expect(byId.domains.offered).toBe('10');
        expect(byId.users.offered).toBe('Up to 6');
        expect(byId['vpn-devices'].offered).toBe('10 per user');
        expect(byId.storage.current).toBe('Up to 6 GB');
    });
});
