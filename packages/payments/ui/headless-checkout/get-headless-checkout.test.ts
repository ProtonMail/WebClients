import { APPS } from '@proton/shared/lib/constants';

import { CYCLE, PLANS, PLAN_TYPES } from '../../core/constants';
import type { Pricing } from '../../core/interface';
import type { Plan, PlansMap } from '../../core/plan/interface';
import { SubscriptionMode, TaxInclusive } from '../../core/subscription/constants';
import { createHeadlessCheckoutContextInner, getHeadlessCheckout } from './get-headless-checkout';

const makePricing = (monthly: number, yearly?: number, twoYears?: number): Pricing =>
    ({
        [CYCLE.MONTHLY]: monthly,
        ...(yearly !== undefined ? { [CYCLE.YEARLY]: yearly } : {}),
        ...(twoYears !== undefined ? { [CYCLE.TWO_YEARS]: twoYears } : {}),
    }) as Pricing;

const makePlan = (overrides: Partial<Plan>): Plan =>
    ({
        Type: PLAN_TYPES.PLAN,
        MaxMembers: 0,
        MaxDomains: 0,
        Pricing: makePricing(0),
        DefaultPricing: makePricing(0),
        ...overrides,
    }) as Plan;

const makeCheckResult = (overrides: Partial<any> = {}): any => ({
    Amount: 4788,
    AmountDue: 4788,
    Coupon: null,
    CouponDiscount: 0,
    Proration: 0,
    Credit: 0,
    Gift: 0,
    Currency: 'USD',
    Cycle: CYCLE.YEARLY,
    PeriodEnd: Math.floor(Date.now() / 1000 + 365 * 24 * 60 * 60),
    SubscriptionMode: 'Regular',
    BaseRenewAmount: null,
    RenewCycle: null,
    ...overrides,
});

const app = APPS.PROTONMAIL;

const mailPlan = makePlan({
    Name: PLANS.MAIL,
    Title: 'Mail Plus',
    Pricing: makePricing(499, 4788, 8376),
    DefaultPricing: makePricing(499, 4788, 8376),
});

describe('getHeadlessCheckout', () => {
    describe('hide when zero', () => {
        it('should hide proration, unused-credit, coupon, credit, gift when zero', () => {
            const plansMap: PlansMap = { [PLANS.MAIL]: mailPlan };
            const checkResult = makeCheckResult();

            const result = getHeadlessCheckout({
                planIDs: { [PLANS.MAIL]: 1 },
                plansMap,
                checkResult,
                app,
            });

            expect(result.getItem('proration').visible).toBe(false);
            expect(result.getItem('unusedCredit').visible).toBe(false);
            expect(result.getItem('coupon').visible).toBe(false);
            expect(result.getItem('credit').visible).toBe(false);
            expect(result.getItem('gift').visible).toBe(false);
        });
    });

    describe('item ordering', () => {
        it('should return items in canonical order', () => {
            const plansMap: PlansMap = { [PLANS.MAIL]: mailPlan };
            const checkResult = makeCheckResult({
                Amount: 4788,
                AmountDue: 4000,
                Proration: -200,
                CouponDiscount: -300,
                Credit: -100,
                Gift: -188,
                TaxInclusive: 'EXCLUSIVE' as any,
                Taxes: [{ Name: 'VAT', Rate: 20, Amount: 100 }],
                Coupon: { Code: 'TEST', Description: 'test', MaximumRedemptionsPerUser: null },
            });

            const result = getHeadlessCheckout({
                planIDs: { [PLANS.MAIL]: 1 },
                plansMap,
                checkResult,
                app,
            });

            const types = Object.keys(result.items);
            expect(types).toEqual([
                'billingCycle',
                'members',
                'addons',
                'planAmount',
                'discount',
                'proration',
                'unusedCredit',
                'coupon',
                'credit',
                'gift',
                'planAmountWithDiscount',
                'taxExclusive',
                'nextBilling',
                'amountDue',
                'renewalNotice',
                'taxInclusive',
            ]);
        });
    });

    describe('getItem helper', () => {
        it('should return a typed item by type', () => {
            const plansMap: PlansMap = { [PLANS.MAIL]: mailPlan };
            const checkResult = makeCheckResult({ Amount: 4788, AmountDue: 4788 });

            const result = getHeadlessCheckout({
                planIDs: { [PLANS.MAIL]: 1 },
                plansMap,
                checkResult,
                app,
            });

            const amountDue = result.getItem('amountDue');
            expect(amountDue.type).toBe('amountDue');
            expect(amountDue.amountDue).toBe(4788);
        });

        it('should return empty array for missing addon type when no addons exist', () => {
            const plansMap: PlansMap = { [PLANS.MAIL]: mailPlan };
            const checkResult = makeCheckResult();

            const result = getHeadlessCheckout({
                planIDs: { [PLANS.MAIL]: 1 },
                plansMap,
                checkResult,
                app,
            });

            const addon = result.getItem('addons');
            expect(addon.addons.length).toBe(0);
            expect(addon.visible).toBe(false);
        });

        it('should return the same item as direct access', () => {
            const plansMap: PlansMap = { [PLANS.MAIL]: mailPlan };
            const checkResult = makeCheckResult();

            const result = getHeadlessCheckout({
                planIDs: { [PLANS.MAIL]: 1 },
                plansMap,
                checkResult,
                app,
            });

            const item = result.getItem('planAmount');
            expect(item).toBe(result.items.planAmount);
        });
    });

    describe('escape hatches', () => {
        it('should expose raw checkoutUi and checkResult', () => {
            const plansMap: PlansMap = { [PLANS.MAIL]: mailPlan };
            const checkResult = makeCheckResult();

            const result = getHeadlessCheckout({
                planIDs: { [PLANS.MAIL]: 1 },
                plansMap,
                checkResult,
                app,
            });

            expect(result.checkResult).toBe(checkResult);
            expect(result.checkoutUi).toBeDefined();
            expect(result.checkoutUi.planTitle).toBe('Mail Plus');
        });
    });
});

describe('createHeadlessCheckoutContextInner', () => {
    it('should create context with correct plan metadata for paid plan', () => {
        const plansMap: PlansMap = { [PLANS.MAIL]: mailPlan };
        const checkResult = makeCheckResult({ Amount: 4788, AmountDue: 4788, Cycle: CYCLE.YEARLY });

        const context = createHeadlessCheckoutContextInner({
            planIDs: { [PLANS.MAIL]: 1 },
            plansMap,
            checkResult,
            app,
        });

        expect(context.planTitle).toBe('Mail Plus');
        expect(context.isPaidPlan).toBe(true);
        expect(context.isFreePlan).toBe(false);
        expect(context.isLifetime).toBe(false);
        expect(context.isTrial).toBe(false);
        expect(context.cycle).toBe(CYCLE.YEARLY);
        expect(context.currency).toBe('USD');
    });

    it('should detect free plan correctly', () => {
        const plansMap: PlansMap = { [PLANS.MAIL]: mailPlan };
        const checkResult = makeCheckResult({ Amount: 0, AmountDue: 0 });

        const context = createHeadlessCheckoutContextInner({
            planIDs: {},
            plansMap,
            checkResult,
            app,
        });

        expect(context.isPaidPlan).toBe(false);
        expect(context.isFreePlan).toBe(true);
        expect(context.planTitle).toBe('Free');
    });

    it('should auto-detect trial from checkResult.SubscriptionMode', () => {
        const plansMap: PlansMap = { [PLANS.MAIL]: mailPlan };
        const checkResult = makeCheckResult({
            Amount: 0,
            AmountDue: 0,
            SubscriptionMode: SubscriptionMode.Trial,
        });

        const context = createHeadlessCheckoutContextInner({
            planIDs: { [PLANS.MAIL]: 1 },
            plansMap,
            checkResult,
            app,
        });

        expect(context.isTrial).toBe(true);
    });

    it('should allow explicit isTrial override', () => {
        const plansMap: PlansMap = { [PLANS.MAIL]: mailPlan };
        const checkResult = makeCheckResult({
            Amount: 4788,
            AmountDue: 0,
            SubscriptionMode: SubscriptionMode.Regular,
        });

        const context = createHeadlessCheckoutContextInner({
            planIDs: { [PLANS.MAIL]: 1 },
            plansMap,
            checkResult,
            isTrial: true,
            app,
        });

        expect(context.isTrial).toBe(true);
    });

    it('should set isTaxInclusive correctly', () => {
        const plansMap: PlansMap = { [PLANS.MAIL]: mailPlan };

        const inclusive = createHeadlessCheckoutContextInner({
            planIDs: { [PLANS.MAIL]: 1 },
            plansMap,
            checkResult: makeCheckResult({
                TaxInclusive: TaxInclusive.INCLUSIVE,
                Taxes: [{ Name: 'VAT', Rate: 20, Amount: 958 }],
            }),
            app,
        });
        expect(inclusive.isTaxInclusive).toBe(true);
        expect(inclusive.isTaxExclusive).toBe(false);

        const exclusive = createHeadlessCheckoutContextInner({
            planIDs: { [PLANS.MAIL]: 1 },
            plansMap,
            checkResult: makeCheckResult({
                TaxInclusive: TaxInclusive.EXCLUSIVE,
                Taxes: [{ Name: 'VAT', Rate: 20, Amount: 958 }],
            }),
            app,
        });
        expect(exclusive.isTaxInclusive).toBe(false);
        expect(exclusive.isTaxExclusive).toBe(true);
    });
});
