import { useEffect, useState } from 'react';

import { usePlans } from '@proton/account/plans/hooks';
import useLoading from '@proton/hooks/useLoading';
import { getCheckoutUi } from '@proton/payments/core/checkout';
import { COUPON_CODES, CYCLE, type PLANS } from '@proton/payments/core/constants';
import { getPlansMap } from '@proton/payments/core/subscription/plans-map-wrapper';

import { useAutomaticCurrency } from '../../../../../payments/client-extensions/index';
import { usePaymentsApi } from '../../../../../payments/react-extensions/usePaymentsApi';
import type { PriceData } from '../helpers/interface';
import { roundToLower, roundToUpper } from '../helpers/paidUserNudgeHelper';

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
        currency,
    });

    useEffect(() => {
        if (!currency || !plans) {
            return;
        }

        const getPrices = async () => {
            const result = await paymentsApi.checkSubscription({
                Plans: { [plan]: 1 },
                Currency: currency,
                Cycle: CYCLE.YEARLY,
                CouponCode: COUPON_CODES.ANNUALOFFER25,
            });

            const plansMap = getPlansMap(plans.plans, currency, false);

            const checkout = getCheckoutUi({
                planIDs: { [plan]: 1 },
                plansMap,
                checkResult: result,
            });

            const yearlyPrice = roundToUpper(checkout.withoutDiscountPerMonth * 12);
            const discountedPrice = roundToUpper(checkout.withDiscountPerCycle);
            const savedAmount = roundToLower(checkout.discountPerCycle);

            setPrices({
                yearlyPrice,
                discountedPrice,
                savedAmount,
                currency,
            });
        };

        void withLoading(getPrices);
    }, [currency, plans]);

    return {
        loading,
        prices,
    };
};
