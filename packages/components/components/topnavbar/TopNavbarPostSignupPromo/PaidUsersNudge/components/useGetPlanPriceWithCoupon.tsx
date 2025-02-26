import { useEffect, useState } from 'react';

import { usePlans } from '@proton/account/plans/hooks';
import { useAutomaticCurrency } from '@proton/components/payments/client-extensions';
import { usePaymentsApi } from '@proton/components/payments/react-extensions/usePaymentsApi';
import useLoading from '@proton/hooks/useLoading';
import { COUPON_CODES, CYCLE, type PLANS, getPlansMap } from '@proton/payments';
import { getCheckout } from '@proton/shared/lib/helpers/checkout';

import { type PriceData } from './interface';
import { roundToUpper } from './paidUserNudgeHelper';

interface Props {
    plan: PLANS;
}

export const useGetPlanPriceWithCoupon = ({ plan }: Props) => {
    const [plans] = usePlans();
    const { paymentsApi } = usePaymentsApi();
    const [currency] = useAutomaticCurrency();

    const [loading, withLoading] = useLoading(true);

    const [prices, setPrices] = useState<PriceData>({
        yearlyPrice: 0,
        discountedPrice: 0,
        savedAmount: 0,
        savedPercentage: 0,
    });

    useEffect(() => {
        if (!currency || !plans) {
            return;
        }

        const getPrices = async () => {
            const result = await paymentsApi.checkWithAutomaticVersion({
                Plans: { [plan]: 1 },
                Currency: currency,
                Cycle: CYCLE.YEARLY,
                CouponCode: COUPON_CODES.ANNUALOFFER25,
            });

            const plansMap = getPlansMap(plans.plans, currency, false);

            const checkout = getCheckout({
                planIDs: { [plan]: 1 },
                plansMap,
                checkResult: result,
            });

            const yearlyPrice = roundToUpper(checkout.withoutDiscountPerMonth * 12);
            const discountedPrice = roundToUpper(checkout.withDiscountPerCycle);

            setPrices({
                yearlyPrice,
                discountedPrice,
                savedAmount: checkout.discountPerCycle,
                savedPercentage: checkout.discountPercent,
            });
        };

        void withLoading(getPrices);
    }, [currency, plans]);

    return {
        loading,
        prices,
    };
};
