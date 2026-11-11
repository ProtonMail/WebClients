import type { PaymentsContextOptimisticType } from '@proton/payments-ui/ui/context/PaymentContextOptimistic';
import type { PaymentsCheckoutUI } from '@proton/payments/core/checkout';
import { CYCLE } from '@proton/payments/core/constants';
import { getPricingPerMember } from '@proton/payments/core/price-helpers';
import { getIsVpnB2BPlan } from '@proton/shared/lib/payments/plan/helpers';
import type { Plan } from '@proton/shared/lib/payments/plan/interface';

import type { BusinessReferralPlan } from '../config/planConfigs';

const getWholePlanPrices = (checkoutUi: PaymentsCheckoutUI) => ({
    currency: checkoutUi.currency,
    regularPricePerMonth: checkoutUi.withoutDiscountPerMonth,
    pricePerMonth: checkoutUi.withDiscountPerMonth,
    renewalPricePerMonth: checkoutUi.renewPrice / checkoutUi.renewCycle,
});

const getOneMemberPrices = (checkoutUi: PaymentsCheckoutUI, plan: Plan) => ({
    currency: checkoutUi.currency,
    regularPricePerMonth: getPricingPerMember(plan)[CYCLE.MONTHLY] ?? checkoutUi.oneMemberPerMonth,
    pricePerMonth: checkoutUi.withDiscountOneMemberPerMonth,
    renewalPricePerMonth: checkoutUi.oneMemberPerMonth,
});

export const getPlanCardPrices = (payments: PaymentsContextOptimisticType, planName: BusinessReferralPlan) => {
    const planToCheck = {
        planIDs: { [planName]: 1 },
        cycle: payments.options.cycle,
        currency: payments.options.currency,
    };
    const coupon = payments.getCoupon(planToCheck);
    const { checkoutUi } = payments.getPriceOrFallback({ ...planToCheck, coupon, trial: false });

    const plan = payments.plansMap[planName];
    if (plan && getIsVpnB2BPlan(planName)) {
        return getOneMemberPrices(checkoutUi, plan);
    }

    return getWholePlanPrices(checkoutUi);
};
