import { PLANS } from '@proton/payments/core/constants';
import type { PlansMap } from '@proton/payments/core/plan/interface';

import { getHeadlessCheckout } from '../get-headless-checkout';
import { defaultApp as app, makeCheckResult, makePlan, makePricing } from './test-helpers';

jest.mock('../../components/RenewalNotice', () => ({
    getCheckoutRenewNoticeTextFromCheckResult: jest.fn(() => 'mocked renewal notice'),
    getSwitchTermsNoticeText: jest.fn(() => 'mocked switch terms notice'),
    calculateRenewalTimeDuringCheckout: jest.fn(() => 'mocked renewal time'),
}));

const mailPlan = makePlan({
    Name: PLANS.MAIL,
    Title: 'Mail Plus',
    Pricing: makePricing(499, 4788, 8376),
    DefaultPricing: makePricing(499, 4788, 8376),
});

const passBasicPlan = makePlan({
    Name: PLANS.PASS_BASIC,
    Title: 'Pass Basic',
    Pricing: makePricing(199, 1999, 3999),
    DefaultPricing: makePricing(199, 1999, 3999),
});

const notForbidden: any = { forbidden: false };

describe('createRenewalNoticeItem', () => {
    it('should include renewal-notice line item with correct visibility', () => {
        const plansMap: PlansMap = { [PLANS.MAIL]: mailPlan };
        const checkResult = makeCheckResult();

        const result = getHeadlessCheckout({
            planIDs: { [PLANS.MAIL]: 1 },
            plansMap,
            checkResult,
            paymentForbiddenReason: notForbidden,
            app,
        });

        const renewalNotice = result.getItem('renewalNotice');
        expect(renewalNotice.visible).toBe(true);
        expect(renewalNotice.content).toBe('mocked renewal notice');
    });

    it('should use the switch terms notice for Pass basic', () => {
        const result = getHeadlessCheckout({
            planIDs: { [PLANS.PASS_BASIC]: 1 },
            plansMap: { [PLANS.PASS_BASIC]: passBasicPlan },
            checkResult: makeCheckResult(),
            paymentForbiddenReason: notForbidden,
            app,
        });

        expect(result.getItem('renewalNotice').content).toBe('mocked switch terms notice');
    });
});
