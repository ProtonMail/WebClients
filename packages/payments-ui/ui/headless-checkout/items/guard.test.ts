import { PLANS } from '@proton/payments/core/constants';
import { GUARD_ERROR_CODES } from '@proton/payments/core/subscription/guard';

import { getHeadlessCheckout } from '../get-headless-checkout';
import { defaultApp as app, makeCheckResult, makePlan, makePricing } from './test-helpers';

const mailPlan = makePlan({
    Name: PLANS.MAIL,
    Title: 'Mail Plus',
    Pricing: makePricing(499, 4788, 8376),
    DefaultPricing: makePricing(499, 4788, 8376),
});

const getCheckout = (GuardResult?: { Code?: number; Message: string }[] | null) =>
    getHeadlessCheckout({
        planIDs: { [PLANS.MAIL]: 1 },
        plansMap: { [PLANS.MAIL]: mailPlan },
        checkResult: makeCheckResult({ Amount: 4788, AmountDue: 4788, GuardResult }),
        app,
    });

describe('guard line item', () => {
    it('is hidden and not blocking when GuardResult is absent', () => {
        const checkout = getCheckout();

        expect(checkout.getItem('guard')).toEqual({ type: 'guard', guards: [], visible: false });
        expect(checkout.isGuardBlocked).toBe(false);
    });

    it('is hidden and not blocking when GuardResult is null', () => {
        const checkout = getCheckout(null);

        expect(checkout.getItem('guard').visible).toBe(false);
        expect(checkout.isGuardBlocked).toBe(false);
    });

    it('is hidden and not blocking when GuardResult is empty', () => {
        const checkout = getCheckout([]);

        expect(checkout.getItem('guard').visible).toBe(false);
        expect(checkout.isGuardBlocked).toBe(false);
    });

    it('is visible and blocking with the exact guards when GuardResult is non-empty', () => {
        const guards = [{ Code: GUARD_ERROR_CODES.TOO_LITTLE_SPACE, Message: 'raw backend message' }];
        const checkout = getCheckout(guards);

        expect(checkout.getItem('guard')).toEqual({ type: 'guard', guards, visible: true });
        expect(checkout.isGuardBlocked).toBe(true);
    });
});
