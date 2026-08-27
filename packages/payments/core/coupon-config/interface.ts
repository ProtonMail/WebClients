import type { StrictRequired } from '@proton/shared/lib/interfaces';

import type { CouponHideFlag } from '../addon/interfaces';
import type { CYCLE, PLANS } from '../constants';
import type { Currency, Cycle, PlanIDs } from '../interface';
import type { PlansMap } from '../plan/interface';
import type { CouponDiscountBreakdownBE, SubscriptionEstimation } from '../subscription/interface';

export type CouponConfigProps = {
    checkResult: SubscriptionEstimation | undefined;
    planIDs: PlanIDs;
    plansMap: PlansMap;
};

type CouponConfigRequiredProps = StrictRequired<CouponConfigProps>;

export function isCouponConfigRequiredProps(props: CouponConfigProps): props is CouponConfigRequiredProps {
    return props.checkResult !== undefined;
}

/**
 * Non-React coupon configuration flags and matching rules.
 * React render callbacks live in @proton/payments-ui.
 */
export type CouponConfigMetadata = {
    coupons: string | string[];
    specialCases?: {
        planName: PLANS;
        cycle: CYCLE;
    }[];
    hidden?: boolean;
    cyclePriceComparePosition?: 'before' | 'after';
    availableCycles?: CYCLE[];
    showMigrationDiscountLossWarning?: boolean;
    hideLumoAddonBanner?: boolean;
    hideMeetAddonBanner?: boolean;
    disableCurrencySelector?: boolean;
    blockManualEntryOfCoupon?: boolean;
    mockCouponDiscountBreakdown?: Record<Currency, null | Record<Cycle, null | CouponDiscountBreakdownBE>>;
};

/** Compile-time guard: every CouponHideFlag the addon configs reference must exist here. */
export type CouponHideFlagsOnConfig = Pick<CouponConfigMetadata, CouponHideFlag>;
