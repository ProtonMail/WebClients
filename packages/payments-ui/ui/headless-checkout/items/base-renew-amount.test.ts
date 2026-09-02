import { CYCLE, PLANS } from '@proton/payments/core/constants';
import type { PlansMap } from '@proton/payments/core/plan/interface';
import { SubscriptionMode } from '@proton/payments/core/subscription/constants';

import { createHeadlessCheckoutContextInner } from '../get-headless-checkout';
import { BASE_RENEW_AMOUNT_LINE_ITEM_TYPE, createBaseRenewAmountItem } from './base-renew-amount';
import { defaultApp as app, makeCheckResult, makePlan, makePricing } from './test-helpers';

const mailPlan = makePlan({
    Name: PLANS.MAIL,
    Title: 'Mail Plus',
    Pricing: makePricing(499, 4788, 8376),
    DefaultPricing: makePricing(499, 4788, 8376),
});

const makeContext = (params: Parameters<typeof createHeadlessCheckoutContextInner>[0]) =>
    createHeadlessCheckoutContextInner(params);

describe('createBaseRenewAmountItem', () => {
    it('should expose the base-renew-amount line item type', () => {
        const plansMap: PlansMap = { [PLANS.MAIL]: mailPlan };
        const checkResult = makeCheckResult();

        const item = createBaseRenewAmountItem(
            makeContext({ planIDs: { [PLANS.MAIL]: 1 }, plansMap, checkResult, app })
        );

        expect(item.type).toBe(BASE_RENEW_AMOUNT_LINE_ITEM_TYPE);
        expect(item.type).toBe('baseRenewAmount');
    });

    it('should expose the base renew amount from the checkout result', () => {
        const plansMap: PlansMap = { [PLANS.MAIL]: mailPlan };
        const checkResult = makeCheckResult({ BaseRenewAmount: 959 });

        const item = createBaseRenewAmountItem(
            makeContext({ planIDs: { [PLANS.MAIL]: 1 }, plansMap, checkResult, app })
        );

        expect(item.baseRenewAmount).toBe(959);
    });

    it('should default baseRenewAmount to 0 when the checkout result is null', () => {
        const plansMap: PlansMap = { [PLANS.MAIL]: mailPlan };
        const checkResult = makeCheckResult({ BaseRenewAmount: null });

        const item = createBaseRenewAmountItem(
            makeContext({ planIDs: { [PLANS.MAIL]: 1 }, plansMap, checkResult, app })
        );

        expect(item.baseRenewAmount).toBe(0);
    });

    it('should default baseRenewAmount to 0 when the checkout result is undefined', () => {
        const plansMap: PlansMap = { [PLANS.MAIL]: mailPlan };
        const checkResult = makeCheckResult({ BaseRenewAmount: undefined });

        const item = createBaseRenewAmountItem(
            makeContext({ planIDs: { [PLANS.MAIL]: 1 }, plansMap, checkResult, app })
        );

        expect(item.baseRenewAmount).toBe(0);
    });

    it('should expose the currency from the checkout result', () => {
        const plansMap: PlansMap = { [PLANS.MAIL]: mailPlan };
        const checkResult = makeCheckResult({ Currency: 'EUR' });

        const item = createBaseRenewAmountItem(
            makeContext({ planIDs: { [PLANS.MAIL]: 1 }, plansMap, checkResult, app })
        );

        expect(item.currency).toBe('EUR');
    });

    it('should expose the label describing the amount due after trial', () => {
        const plansMap: PlansMap = { [PLANS.MAIL]: mailPlan };
        const checkResult = makeCheckResult();

        const item = createBaseRenewAmountItem(
            makeContext({ planIDs: { [PLANS.MAIL]: 1 }, plansMap, checkResult, app })
        );

        expect(item.label).toBe('Amount due after trial');
    });

    it('should be visible when isTrial is true', () => {
        const plansMap: PlansMap = { [PLANS.MAIL]: mailPlan };
        const checkResult = makeCheckResult();

        const item = createBaseRenewAmountItem(
            makeContext({ planIDs: { [PLANS.MAIL]: 1 }, plansMap, checkResult, app, isTrial: true })
        );

        expect(item.visible).toBe(true);
    });

    it('should be hidden when isTrial is false', () => {
        const plansMap: PlansMap = { [PLANS.MAIL]: mailPlan };
        const checkResult = makeCheckResult();

        const item = createBaseRenewAmountItem(
            makeContext({ planIDs: { [PLANS.MAIL]: 1 }, plansMap, checkResult, app, isTrial: false })
        );

        expect(item.visible).toBe(false);
    });

    it('should auto-detect a trial from a trial subscription mode', () => {
        const plansMap: PlansMap = { [PLANS.MAIL]: mailPlan };
        const checkResult = makeCheckResult({ SubscriptionMode: SubscriptionMode.Trial });

        const item = createBaseRenewAmountItem(
            makeContext({ planIDs: { [PLANS.MAIL]: 1 }, plansMap, checkResult, app })
        );

        expect(item.visible).toBe(true);
    });

    it('should be hidden for a regular subscription', () => {
        const plansMap: PlansMap = { [PLANS.MAIL]: mailPlan };
        const checkResult = makeCheckResult({ SubscriptionMode: SubscriptionMode.Regular });

        const item = createBaseRenewAmountItem(
            makeContext({ planIDs: { [PLANS.MAIL]: 1 }, plansMap, checkResult, app })
        );

        expect(item.visible).toBe(false);
    });

    it('should ignore the cycle when deriving the item', () => {
        const plansMap: PlansMap = { [PLANS.MAIL]: mailPlan };
        const checkResult = makeCheckResult({ Cycle: CYCLE.MONTHLY, BaseRenewAmount: 799 });

        const item = createBaseRenewAmountItem(
            makeContext({ planIDs: { [PLANS.MAIL]: 1 }, plansMap, checkResult, app })
        );

        expect(item.baseRenewAmount).toBe(799);
        expect(item.currency).toBe('USD');
    });
});
