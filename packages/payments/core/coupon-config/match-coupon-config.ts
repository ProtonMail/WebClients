import { getPlanNameFromIDs } from '../plan/helpers';
import type { CouponConfigMetadata, CouponConfigProps } from './interface';
import { isCouponConfigRequiredProps } from './interface';

export function matchCouponConfig<T extends CouponConfigMetadata>(
    checkoutProps: CouponConfigProps,
    couponConfigs: T[]
): T | undefined {
    if (!isCouponConfigRequiredProps(checkoutProps)) {
        return;
    }

    const selectedCoupon = checkoutProps.checkResult.Coupon?.Code;
    const selectedCycle = checkoutProps.checkResult.Cycle;
    const selectedPlanName = getPlanNameFromIDs(checkoutProps.planIDs);

    return couponConfigs.find(
        (it) =>
            (selectedCoupon &&
                (Array.isArray(it.coupons) ? it.coupons.includes(selectedCoupon) : it.coupons === selectedCoupon)) ||
            (selectedCycle &&
                it.specialCases?.some(
                    (specialCase) => specialCase.planName === selectedPlanName && specialCase.cycle === selectedCycle
                ))
    );
}
