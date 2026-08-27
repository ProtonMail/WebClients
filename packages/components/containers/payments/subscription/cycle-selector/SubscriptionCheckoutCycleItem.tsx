import { getCheckoutUi } from '@proton/payments/core/checkout';
import type { CouponConfigMetadata } from '@proton/payments/core/coupon-config/interface';
import type { PlanIDs } from '@proton/payments/core/interface';
import type { PlansMap } from '@proton/payments/core/plan/interface';
import type { SubscriptionEstimation } from '@proton/payments/core/subscription/interface';

import CycleItemView from './CycleItemView';

const SubscriptionCheckoutCycleItem = ({
    checkResult,
    plansMap,
    planIDs,
    loading,
    couponConfig,
}: {
    checkResult: SubscriptionEstimation;
    plansMap: PlansMap;
    planIDs: PlanIDs;
    loading?: boolean;
    couponConfig?: CouponConfigMetadata;
}) => {
    const checkout = getCheckoutUi({ planIDs, plansMap, checkResult });

    return (
        <div className="p-4 mb-4 border rounded bg-norm flex flex-nowrap items-stretch border-primary border-2">
            <CycleItemView loading={loading} checkout={checkout} couponConfig={couponConfig} />
        </div>
    );
};

export default SubscriptionCheckoutCycleItem;
