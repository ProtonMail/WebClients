import { getOptimisticCheckResult } from '@proton/payments/core/checkout';
import { ADDON_NAMES, CYCLE, PLANS } from '@proton/payments/core/constants';
import type { Plan, PlansMap } from '@proton/shared/lib/payments/plan/interface';
import { SubscriptionMode } from '@proton/shared/lib/payments/subscription/constants';

import { getHeadlessCheckout } from '../get-headless-checkout';
import { defaultApp as app, makeAddon, makeCheckResult, makePlan } from './test-helpers';

const demoOffer = { Name: 'demo', Description: 'Demo offer' };
const demoOffers = { [CYCLE.MONTHLY]: demoOffer, [CYCLE.YEARLY]: demoOffer };

const pricing = (monthly: number, yearly: number) =>
    ({ [CYCLE.MONTHLY]: monthly, [CYCLE.YEARLY]: yearly }) as Plan['Pricing'];

const withoutOffer = (plan: Plan): Plan => ({ ...plan, Pricing: plan.DefaultPricing, Offers: {} });

const mapByName = (plans: Plan[]): PlansMap => Object.fromEntries(plans.map((plan) => [plan.Name, plan]));

/** `GET payments/v4/plans?Currency=AUD&Offer=demo` on the payments env: offer price in Pricing, regular in DefaultPricing. */
const bundle = makePlan({
    Name: PLANS.BUNDLE,
    Title: 'Proton Unlimited',
    Currency: 'AUD',
    Pricing: pricing(819, 10000),
    DefaultPricing: pricing(2079, 19188),
    Offers: demoOffers,
});

const bundleCheckResult = (overrides = {}) =>
    makeCheckResult({
        Currency: 'AUD',
        Cycle: CYCLE.MONTHLY,
        Amount: 2079,
        AmountDue: 819,
        OfferName: 'demo',
        OfferDescription: 'Demo offer',
        OfferDiscount: [{ Name: PLANS.BUNDLE, Amount: -1260 }],
        ...overrides,
    });

const yearlyBundleCheckResult = (overrides = {}) =>
    bundleCheckResult({
        Cycle: CYCLE.YEARLY,
        Amount: 19188,
        AmountDue: 10000,
        OfferDiscount: [{ Name: PLANS.BUNDLE, Amount: -9188 }],
        ...overrides,
    });

const getBundleCheckout = (plan: Plan, checkResult = bundleCheckResult()) =>
    getHeadlessCheckout({ planIDs: { [PLANS.BUNDLE]: 1 }, plansMap: mapByName([plan]), checkResult, app });

/** Half price on every line: the plan, its extra users and its domain. */
const businessPlans = [
    makePlan({
        Name: PLANS.BUNDLE_PRO_2024,
        Title: 'Business',
        MaxMembers: 1,
        Pricing: pricing(1299, 6600),
        DefaultPricing: pricing(1299, 13200),
        Offers: { [CYCLE.YEARLY]: demoOffer },
    }),
    makeAddon({
        Name: ADDON_NAMES.MEMBER_BUNDLE_PRO_2024,
        MaxMembers: 1,
        Pricing: pricing(1299, 6600),
        DefaultPricing: pricing(1299, 13200),
        Offers: { [CYCLE.YEARLY]: demoOffer },
    }),
    makeAddon({
        Name: ADDON_NAMES.DOMAIN_BUNDLE_PRO_2024,
        MaxDomains: 1,
        Pricing: pricing(150, 840),
        DefaultPricing: pricing(150, 1680),
        Offers: { [CYCLE.YEARLY]: demoOffer },
    }),
];

const plansLoaded = [
    ['with the offer', (plan: Plan) => plan],
    ['without the offer', withoutOffer],
] as const;

describe('offer in the headless checkout', () => {
    it('names the offer and gives its discount against the regular price', () => {
        expect(getBundleCheckout(bundle).getItem('offer')).toEqual({
            type: 'offer',
            offerCode: 'demo',
            offerDescription: 'Demo offer',
            discountAmount: -1260,
            discountPercent: 61,
            currency: 'AUD',
            visible: true,
        });
    });

    it.each(plansLoaded)('shows the offer price in the rows, plans loaded %s', (_, load) => {
        const checkout = getBundleCheckout(load(bundle));

        expect(checkout.getItem('planAmount').amount).toBe(819);
        expect(checkout.getItem('members').pricePerAllPerMonth).toBe(819);
        expect(checkout.getItem('members').pricePerOnePerMonth).toBe(819);
        expect(checkout.getItem('coupon').visible).toBe(false);
        expect(checkout.getItem('discount').visible).toBe(true);
        expect(checkout.getItem('discount').discountPercent).toBe(61);
        expect(checkout.getItem('planDiscount').discountPercent).toBe(61);
    });

    it('measures a longer cycle against the regular monthly price times the cycle', () => {
        const checkout = getBundleCheckout(bundle, yearlyBundleCheckResult());

        expect(checkout.getItem('planAmount').amount).toBe(10000);
        expect(checkout.getItem('members').pricePerAllPerMonth).toBeCloseTo(833.33);
        expect(checkout.getItem('discount').withoutDiscountPerCycle).toBe(2079 * 12);
        expect(checkout.getItem('discount').discountPercent).toBe(60);
    });

    it.each(plansLoaded)('gives every row its share of the offer, plans loaded %s', (_, load) => {
        const checkout = getHeadlessCheckout({
            planIDs: {
                [PLANS.BUNDLE_PRO_2024]: 1,
                [ADDON_NAMES.MEMBER_BUNDLE_PRO_2024]: 2,
                [ADDON_NAMES.DOMAIN_BUNDLE_PRO_2024]: 1,
            },
            plansMap: mapByName(businessPlans.map(load)),
            checkResult: makeCheckResult({
                Amount: 41280,
                AmountDue: 20640,
                OfferName: 'demo',
                OfferDiscount: [
                    { Name: PLANS.BUNDLE_PRO_2024, Amount: -6600 },
                    { Name: ADDON_NAMES.MEMBER_BUNDLE_PRO_2024, Amount: -13200 },
                    { Name: ADDON_NAMES.DOMAIN_BUNDLE_PRO_2024, Amount: -840 },
                ],
            }),
            app,
        });

        const members = checkout.getItem('members');
        const [domain] = checkout.getItem('addons').addons;
        const total = checkout.getItem('planAmount').amount;

        expect(members.pricePerAllPerMonth).toBe(1650);
        expect(members.pricePerOnePerMonth).toBe(550);
        expect(domain.priceForAllPerMonth).toBe(70);
        expect(domain.pricePerOnePerMonth).toBe(70);
        expect(total).toBe(20640);
        expect((members.pricePerAllPerMonth + domain.priceForAllPerMonth) * CYCLE.YEARLY).toBe(total);
        expect(checkout.getItem('planDiscount').discountPercent).toBe(58);
    });

    it('shows the same rows for the estimate built on the frontend as for the check', () => {
        const estimate = getOptimisticCheckResult({
            planIDs: { [PLANS.BUNDLE]: 1 },
            plansMap: mapByName([bundle]),
            cycle: CYCLE.YEARLY,
            currency: 'AUD',
        });
        const checkout = getBundleCheckout(bundle, estimate);

        expect(checkout.getItem('planAmount').amount).toBe(10000);
        expect(checkout.getItem('members').pricePerAllPerMonth).toBeCloseTo(833.33);
        expect(checkout.getItem('planDiscount').discountPercent).toBe(60);
    });

    it('keeps the proration row next to the offer price on an upgrade', () => {
        const checkout = getBundleCheckout(
            bundle,
            yearlyBundleCheckResult({ Proration: -7667, AmountDue: 2333, SubscriptionMode: SubscriptionMode.Regular })
        );

        expect(checkout.getItem('planAmount').amount).toBe(10000);
        expect(checkout.getItem('proration').amount).toBe(-7667);
        expect(checkout.getItem('amountDue').amountDue).toBe(2333);
        expect(checkout.getItem('planAmount').amount + checkout.getItem('proration').amount).toBe(
            checkout.getItem('amountDue').amountDue
        );
    });

    it.each(plansLoaded)('leaves an add-on outside the offer at its regular price, plans loaded %s', (_, load) => {
        const lumo = makeAddon({
            Name: ADDON_NAMES.LUMO_BUNDLE,
            Pricing: pricing(3999, 38388),
            DefaultPricing: pricing(3999, 38388),
        });
        const checkout = getHeadlessCheckout({
            planIDs: { [PLANS.BUNDLE]: 1, [ADDON_NAMES.LUMO_BUNDLE]: 1 },
            plansMap: mapByName([load(bundle), lumo]),
            checkResult: yearlyBundleCheckResult({
                Amount: 57576,
                AmountDue: 48388,
                OfferDiscount: [
                    { Name: PLANS.BUNDLE, Amount: -9188 },
                    { Name: ADDON_NAMES.LUMO_BUNDLE, Amount: 0 },
                ],
            }),
            app,
        });

        const [lumoRow] = checkout.getItem('addons').addons;
        expect(checkout.getItem('members').pricePerAllPerMonth).toBeCloseTo(833.33);
        expect(lumoRow.priceForAllPerMonth).toBe(3199);
        expect(checkout.getItem('planAmount').amount).toBe(48388);
        expect(checkout.getItem('planDiscount').discountPercent).toBe(60);
    });

    it.each([
        ['the regular price', 19188, 'AU$191.88'],
        ['the offer price', 10000, 'AU$100'],
    ])('states the renewal price the backend sends, here %s', (_, BaseRenewAmount, expectedPrice) => {
        const checkout = getBundleCheckout(
            bundle,
            bundleCheckResult({
                Cycle: CYCLE.TWO_YEARS,
                Amount: 30696,
                AmountDue: 20000,
                OfferDiscount: [{ Name: PLANS.BUNDLE, Amount: -10696 }],
                RenewCycle: CYCLE.YEARLY,
                BaseRenewAmount,
            })
        );

        const notice = JSON.stringify(checkout.getItem('renewalNotice').content);
        expect(notice).toContain(`billed every 12 months at ${expectedPrice}.`);
    });

    it('states no renewal price when the backend sends none', () => {
        const checkout = getBundleCheckout(bundle, yearlyBundleCheckResult({ BaseRenewAmount: null }));

        const notice = JSON.stringify(checkout.getItem('renewalNotice').content);
        expect(notice).toContain('auto-renews every 12 months');
        expect(notice).not.toContain('AU$');
    });

    it('charges the full price when the plans carry an offer that the check did not apply', () => {
        const checkout = getBundleCheckout(
            bundle,
            bundleCheckResult({
                OfferName: null,
                OfferDescription: null,
                OfferDiscount: [{ Name: PLANS.BUNDLE, Amount: 0 }],
                AmountDue: 2079,
            })
        );

        expect(checkout.getItem('offer').visible).toBe(false);
        expect(checkout.getItem('planAmount').amount).toBe(2079);
        expect(checkout.getItem('members').pricePerAllPerMonth).toBe(2079);
        expect(checkout.getItem('discount').visible).toBe(false);
    });
});
