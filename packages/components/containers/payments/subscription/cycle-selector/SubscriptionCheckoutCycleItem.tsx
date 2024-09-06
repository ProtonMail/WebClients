import { c } from 'ttag';

import { CYCLE, DEFAULT_CURRENCY } from '@proton/shared/lib/constants';
import { getCheckout } from '@proton/shared/lib/helpers/checkout';
import type { PlanIDs, PlansMap, SubscriptionCheckResponse } from '@proton/shared/lib/interfaces';

import { getShortBillingText } from '../../helper';
import CycleItemView from './CycleItemView';

const SubscriptionCheckoutCycleItem = ({
    checkResult,
    plansMap,
    planIDs,
    loading,
}: {
    checkResult: SubscriptionCheckResponse;
    plansMap: PlansMap;
    planIDs: PlanIDs;
    loading?: boolean;
}) => {
    const cycle = checkResult?.Cycle || CYCLE.MONTHLY;
    const currency = checkResult?.Currency || DEFAULT_CURRENCY;
    const replacementCycle = cycle;
    const freeMonths = 0;

    const result = getCheckout({ planIDs, plansMap, checkResult });

    return (
        <div className="p-4 mb-4 border rounded bg-norm flex flex-nowrap items-stretch border-primary border-2">
            <CycleItemView
                loading={loading}
                text={getShortBillingText(replacementCycle)}
                currency={currency}
                discount={result.discountPerCycle}
                monthlySuffix={c('Suffix').t`/month`}
                freeMonths={freeMonths}
                total={result.withDiscountPerCycle}
                totalPerMonth={result.withDiscountPerMonth}
                cycle={cycle}
            />
        </div>
    );
};

export default SubscriptionCheckoutCycleItem;
