import { DEFAULT_TAX_BILLING_ADDRESS } from '@proton/payments/core/billing-address/billing-address';
import { CYCLE, DEFAULT_PAYMENT_VENDOR_STATES, FREE_SUBSCRIPTION, PLANS } from '@proton/payments/core/constants';
import { emptyEntitlementCatalog } from '@proton/payments/core/entitlements/empty-entitlement-catalog';
import { FREE_PLAN } from '@proton/payments/core/subscription/freePlans';
import type { PlanToCheck } from '@proton/payments/core/subscription/plan-to-check';
import { getPlansMap } from '@proton/payments/core/subscription/plans-map-wrapper';
import {
    buildLumoSubscription,
    buildMultiSubscriptionContext,
} from '@proton/payments/testing/buildMultiSubscriptionContext';
import { buildSubscription } from '@proton/payments/testing/buildSubscription';
import { getLongTestPlans } from '@proton/payments/testing/data-plans';
import { SubscriptionMode } from '@proton/shared/lib/payments/subscription/constants';

import {
    checkMultiplePlans,
    getAvailablePlansToCheck,
    getEstimationChangeAction,
    getInitialState,
    withBillingDetails,
} from './helpers';

describe('checkMultiplePlans', () => {
    const webMailPlus = buildSubscription({ planName: PLANS.MAIL, cycle: CYCLE.YEARLY, currency: 'CHF' });
    const webLumoPlus = {
        ...buildLumoSubscription(PLANS.LUMO, { ID: 'lumo-plus', Cycle: CYCLE.MONTHLY, Currency: 'CHF' }),
        UpcomingSubscription: buildLumoSubscription(PLANS.LUMO, { Cycle: CYCLE.YEARLY, Currency: 'CHF' }),
    };

    it('computes the optimistic result of a forbidden check against the subscription it changes', async () => {
        const paymentsApi = { multiCheck: vi.fn().mockResolvedValue([]) } as any;

        const [lumoPlusYearly] = await checkMultiplePlans({
            plansToCheck: [{ planIDs: { [PLANS.LUMO]: 1 }, cycle: CYCLE.YEARLY, currency: 'CHF' }],
            paymentsApi,
            multiCheckGroups: { addPromiseToGroup: vi.fn() } as any,
            getLocalizedPlansMap: () => getPlansMap(getLongTestPlans('CHF'), 'CHF', false),
            billingAddress: DEFAULT_TAX_BILLING_ADDRESS,
            multiSubscriptionContext: buildMultiSubscriptionContext([webMailPlus, webLumoPlus]),
        });

        expect(paymentsApi.multiCheck).toHaveBeenCalledWith([], expect.any(Object));
        expect(lumoPlusYearly.SubscriptionMode).toBe(SubscriptionMode.ScheduledChargedImmediately);
    });
});

describe('getInitialState', () => {
    const plans = getLongTestPlans('CHF');
    const baseParams = {
        user: undefined,
        subscription: undefined,
        plansData: undefined,
        cachedPlans: plans,
        paymentStatus: undefined,
        entitlementCatalog: undefined,
        authenticated: true,
        lumoMultiSubscriptions: false,
    };

    it('starts a free user on Mail Plus monthly with the default tax address', () => {
        const state = getInitialState(baseParams);

        expect(state.subscription).toBe(FREE_SUBSCRIPTION);
        expect(state.entitlementCatalog).toBe(emptyEntitlementCatalog);
        expect(state.plansData).toEqual({ plans, freePlan: FREE_PLAN });
        expect(state.billingAddress).toBe(DEFAULT_TAX_BILLING_ADDRESS);
        expect(state.planToCheck).toEqual(
            expect.objectContaining({ planIDs: { [PLANS.MAIL]: 1 }, cycle: CYCLE.MONTHLY, coupon: undefined })
        );
        expect(state.checkResult.Currency).toBe(state.planToCheck.currency);
        expect(state).toEqual(
            expect.objectContaining({
                telemetryContext: 'other',
                product: 'generic',
                initialized: false,
                loading: false,
                vatNumber: undefined,
            })
        );
    });

    it('prefers the loaded plans over the cached ones', () => {
        const plansData = { plans: getLongTestPlans('EUR'), freePlan: FREE_PLAN };

        expect(getInitialState({ ...baseParams, plansData }).plansData).toBe(plansData);
    });

    it('starts without plans when there are neither loaded nor cached ones', () => {
        expect(getInitialState({ ...baseParams, cachedPlans: undefined }).plansData.plans).toEqual([]);
    });

    it('selects the plans of a paid subscription', () => {
        const subscription = buildSubscription({ planName: PLANS.DRIVE, cycle: CYCLE.YEARLY, currency: 'CHF' });

        const state = getInitialState({ ...baseParams, subscription });

        expect(state.subscription).toBe(subscription);
        expect(state.planToCheck.planIDs).toEqual({ [PLANS.DRIVE]: 1 });
    });

    it('takes the billing address from the payment status, restoring the ZIP code only when signed out', () => {
        const paymentStatus = { CountryCode: 'US', State: 'CA', VendorStates: DEFAULT_PAYMENT_VENDOR_STATES };

        expect(getInitialState({ ...baseParams, paymentStatus }).billingAddress).toEqual({
            CountryCode: 'US',
            State: 'CA',
            ZipCode: undefined,
        });
        expect(
            getInitialState({ ...baseParams, paymentStatus, authenticated: false }).billingAddress.ZipCode
        ).toBeTruthy();
    });
});

describe('getEstimationChangeAction', () => {
    const current: PlanToCheck = {
        planIDs: { [PLANS.MAIL]: 1 },
        cycle: CYCLE.MONTHLY,
        currency: 'CHF',
        coupon: undefined,
    };

    it('reports nothing when the selection is the same', () => {
        expect(getEstimationChangeAction(current, { ...current, planIDs: { [PLANS.MAIL]: 1 } })).toBeNull();
    });

    it.each([
        [{ cycle: CYCLE.YEARLY }, 'cycle_changed'],
        [{ currency: 'EUR' as const }, 'currency_changed'],
        [{ coupon: 'COUPON' }, 'coupon_changed'],
        [{ planIDs: { [PLANS.BUNDLE]: 1 } }, 'plan_changed'],
        [{ planIDs: { [PLANS.MAIL]: 2 } }, 'plan_changed'],
    ])('reports %o as %s', (change, action) => {
        expect(getEstimationChangeAction(current, { ...current, ...change })).toBe(action);
    });

    it('reports the cycle first when several things change', () => {
        expect(
            getEstimationChangeAction(current, {
                ...current,
                cycle: CYCLE.YEARLY,
                currency: 'EUR',
                coupon: 'COUPON',
                planIDs: { [PLANS.BUNDLE]: 1 },
            })
        ).toBe('cycle_changed');
    });
});

describe('getAvailablePlansToCheck', () => {
    const plansMap = getPlansMap(getLongTestPlans('CHF'), 'CHF', false);
    const bundle = { planIDs: { [PLANS.BUNDLE]: 1 }, cycle: CYCLE.YEARLY };
    const drive = { planIDs: { [PLANS.DRIVE]: 1 }, cycle: CYCLE.YEARLY };
    const params = {
        availablePlans: [bundle, drive],
        selection: undefined,
        selectionCoupon: 'COUPON',
        currency: 'CHF' as const,
        plansMap,
    };

    it('checks every plan with the selection coupon and the currency', () => {
        expect(getAvailablePlansToCheck(params)).toEqual([
            { ...bundle, currency: 'CHF', coupon: 'COUPON' },
            { ...drive, currency: 'CHF', coupon: 'COUPON' },
        ]);
    });

    it('returns nothing without available plans', () => {
        expect(getAvailablePlansToCheck({ ...params, availablePlans: undefined })).toEqual([]);
    });

    it('uses a plan own coupon key, even when undefined', () => {
        const result = getAvailablePlansToCheck({
            ...params,
            availablePlans: [
                { ...bundle, coupon: 'OWN' },
                { ...drive, coupon: undefined },
            ],
        });

        expect(result).toEqual([{ ...bundle, currency: 'CHF', coupon: 'OWN' }]);
    });

    it('skips plans without a coupon', () => {
        expect(getAvailablePlansToCheck({ ...params, selectionCoupon: undefined })).toEqual([]);
    });

    it('skips plans that do not have the currency', () => {
        expect(getAvailablePlansToCheck({ ...params, currency: 'EUR' })).toEqual([]);
    });

    it('skips the selection, whose own check caches its price', () => {
        const selection = { ...bundle, currency: 'CHF' as const, coupon: 'COUPON' };

        expect(getAvailablePlansToCheck({ ...params, selection })).toEqual([
            { ...drive, currency: 'CHF', coupon: 'COUPON' },
        ]);
    });

    it.each([
        ['coupon', { coupon: 'OTHER' }],
        ['trial', { trial: true }],
        ['cycle', { cycle: CYCLE.MONTHLY }],
    ])('keeps a plan that differs from the selection by its %s', (_, change) => {
        const selection = { ...bundle, currency: 'CHF' as const, coupon: 'COUPON', ...change };

        expect(getAvailablePlansToCheck({ ...params, selection })).toHaveLength(2);
    });
});

describe('withBillingDetails', () => {
    it('returns the address when there are no details', () => {
        const billingAddress = { CountryCode: 'CH', State: null };

        expect(withBillingDetails(billingAddress, undefined)).toEqual(billingAddress);
    });

    it('fills in the fields the address does not have, without empty ones', () => {
        expect(
            withBillingDetails({ CountryCode: 'CH', State: null }, { Company: 'Acme', FirstName: '', City: undefined })
        ).toEqual({ CountryCode: 'CH', State: null, Company: 'Acme' });
    });

    it('keeps what the address has, even a cleared field', () => {
        expect(withBillingDetails({ CountryCode: 'CH', State: null, Company: '' }, { Company: 'Acme' })).toEqual({
            CountryCode: 'CH',
            State: null,
            Company: '',
        });
    });
});
