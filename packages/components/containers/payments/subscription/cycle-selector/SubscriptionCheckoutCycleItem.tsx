import type { PlanIDs, PlansMap, SubscriptionCheckResponse } from '@proton/payments';
import { getCheckoutUi } from '@proton/payments/core/checkout';

import type { CouponConfigRendered } from '../coupon-config/useCouponConfig';
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
    const checkout = getCheckoutUi({ planIDs, plansMap, checkResult });

    return (
        <div className="p-4 mb-4 border rounded bg-norm flex flex-nowrap items-stretch border-primary border-2">
            <CycleItemView loading={loading} checkout={checkout} couponConfig={couponConfig} />
        </div>
    );
};

export default SubscriptionCheckoutCycleItem;
