import { PLANS } from '../../../core/constants';
import type { PlansMap } from '../../../core/plan/interface';
import { SubscriptionMode } from '../../../core/subscription/constants';
import { getHeadlessCheckout } from '../get-headless-checkout';
import { defaultApp as app, makeCheckResult, makePlan, makePricing } from './test-helpers';

const mailPlan = makePlan({
    Name: PLANS.MAIL,
    Title: 'Mail Plus',
    Pricing: makePricing(499, 4788, 8376),
    DefaultPricing: makePricing(499, 4788, 8376),
});

describe('createNextBillingItem', () => {
    it('should show start-date when scheduled and subscription is not free', () => {
        const plansMap: PlansMap = { [PLANS.MAIL]: mailPlan };
        const periodEnd = Math.floor(Date.now() / 1000 + 30 * 24 * 60 * 60);
        const checkResult = makeCheckResult({
            SubscriptionMode: SubscriptionMode.ScheduledChargedLater,
        });

        const result = getHeadlessCheckout({
            planIDs: { [PLANS.MAIL]: 1 },
            plansMap,
            checkResult,
            subscription: { PeriodEnd: periodEnd } as any,
            app,
        });

        const startDate = result.getItem('nextBilling');
        expect(startDate.visible).toBe(true);
        expect(startDate.scheduledSubscriptionStartDate).toBe(periodEnd);
    });

    it('should hide start-date when not scheduled', () => {
        const plansMap: PlansMap = { [PLANS.MAIL]: mailPlan };
        const checkResult = makeCheckResult({
            SubscriptionMode: SubscriptionMode.Regular,
        });

        const result = getHeadlessCheckout({
            planIDs: { [PLANS.MAIL]: 1 },
            plansMap,
            checkResult,
            subscription: { PeriodEnd: 12345 } as any,
            app,
        });

        const startDate = result.getItem('nextBilling');
        expect(startDate.visible).toBe(false);
    });

    it('should hide start-date when subscription is free', () => {
        const plansMap: PlansMap = { [PLANS.MAIL]: mailPlan };
        const checkResult = makeCheckResult({
            SubscriptionMode: SubscriptionMode.ScheduledChargedLater,
        });

        const result = getHeadlessCheckout({
            planIDs: { [PLANS.MAIL]: 1 },
            plansMap,
            checkResult,
            subscription: { isFreeSubscription: true } as any,
            app,
        });

        const startDate = result.getItem('nextBilling');
        expect(startDate.visible).toBe(false);
    });

    it('should hide start-date when subscription is not provided', () => {
        const plansMap: PlansMap = { [PLANS.MAIL]: mailPlan };
        const checkResult = makeCheckResult({
            SubscriptionMode: SubscriptionMode.ScheduledChargedLater,
        });

        const result = getHeadlessCheckout({
            planIDs: { [PLANS.MAIL]: 1 },
            plansMap,
            checkResult,
            app,
        });

        const startDate = result.getItem('nextBilling');
        expect(startDate.visible).toBe(false);
    });
});
