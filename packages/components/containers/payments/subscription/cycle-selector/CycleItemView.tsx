import EllipsisLoader from '@proton/components/components/loader/EllipsisLoader';
import Price from '@proton/components/components/price/Price';
import { type PaymentsCheckout, isLifetimePlanSelected } from '@proton/payments';

import type { CouponConfigRendered } from '../coupon-config/useCouponConfig';
import { getShortBillingText } from '../helpers';
import PlanDiscount from '../helpers/PlanDiscount';
import PlanPrice from '../helpers/PlanPrice';

const CycleItemView = ({
    loading,
    checkout,
    couponConfig,
}: {
    loading?: boolean;
    checkout: PaymentsCheckout;
    couponConfig?: CouponConfigRendered;
}) => {
    const cycleTitle =
        couponConfig?.renderCycleTitle?.({ cycle: checkout.cycle }) ??
        getShortBillingText(checkout.cycle, checkout.planIDs);

    const pricePerMonth = (
        <>
            <Price
                currency={checkout.currency}
                suffix={checkout.monthlySuffix}
                data-testid="price-value-per-user-per-month"
            >
                {checkout.viewPricePerMonth}
            </Price>
            {couponConfig?.renderCyclePriceCompare?.({
                cycle: checkout.cycle,
                suffix: checkout.monthlySuffix,
            })}
        </>
    );

    return (
        <div className="flex-1 pl-2">
            <div className="flex items-center">
                <div className="flex-auto mr-4">
                    <strong className="text-lg">{cycleTitle}</strong>
                </div>
                <PlanPrice loading={loading} total={checkout.withDiscountPerCycle} currency={checkout.currency} />
            </div>
            {!isLifetimePlanSelected(checkout.planIDs) && (
                <div className="flex items-center">
                    <span
                        className="color-weak flex flex-auto"
                        data-testid={`price-per-user-per-month-${checkout.cycle}`}
                    >
                        {loading ? <EllipsisLoader /> : pricePerMonth}
                    </span>

                    <PlanDiscount loading={loading} discount={checkout.discountPerCycle} currency={checkout.currency} />
                </div>
            )}
        </div>
    );
};

export default CycleItemView;
