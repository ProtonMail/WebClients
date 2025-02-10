import { c } from 'ttag';

import type { PlanIDs } from '@proton/payments';
import { CYCLE, DEFAULT_CURRENCY } from '@proton/payments';
import { getCheckout } from '@proton/shared/lib/helpers/checkout';
import type { PlansMap, SubscriptionCheckResponse } from '@proton/shared/lib/interfaces';

import { type CouponConfigRendered } from '../coupon-config/useCouponConfig';
import { getShortBillingText } from '../helpers';
import CycleItemView from './CycleItemView';

const SubscriptionCheckoutCycleItem = ({
    checkResult,
    plansMap,
    planIDs,
    loading,
    couponConfig,
}: {
    checkResult: SubscriptionCheckResponse;
    plansMap: PlansMap;
    planIDs: PlanIDs;
    loading?: boolean;
    couponConfig?: CouponConfigRendered;
}) => {
    const cycle = checkResult?.Cycle || CYCLE.MONTHLY;
    const currency = checkResult?.Currency || DEFAULT_CURRENCY;
    const replacementCycle = cycle;
    const freeMonths = 0;

    const result = getCheckout({ planIDs, plansMap, checkResult });

    const monthlySuffix = c('Suffix').t`/month`;
    const cyclePriceCompare = couponConfig?.renderCyclePriceCompare?.({ cycle, suffix: monthlySuffix });

    const cycleTitle = couponConfig?.renderCycleTitle?.({ cycle }) ?? getShortBillingText(replacementCycle, planIDs);

    return (
        <div className="p-4 mb-4 border rounded bg-norm flex flex-nowrap items-stretch border-primary border-2">
            <CycleItemView
                loading={loading}
                text={cycleTitle}
                currency={currency}
                discount={result.discountPerCycle}
                monthlySuffix={monthlySuffix}
                freeMonths={freeMonths}
                total={result.withDiscountPerCycle}
                totalPerMonth={result.withDiscountPerMonth}
                cycle={cycle}
                planIDs={planIDs}
                cyclePriceCompare={cyclePriceCompare}
            />
        </div>
    );
};

export default SubscriptionCheckoutCycleItem;
