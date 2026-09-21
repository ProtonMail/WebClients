import { useEffect, useState } from 'react';

import { usePlans } from '@proton/account/plans/hooks';
import { getCheckoutUi } from '@proton/payments/core/checkout';
import { COUPON_CODES, CYCLE, PLANS } from '@proton/payments/core/constants';
import type { Currency } from '@proton/payments/core/interface';
import { getPlansMap } from '@proton/payments/core/subscription/plans-map-wrapper';
import clsx from '@proton/utils/clsx';

import { getNormalizedPlanTitleToPlus } from '../../../../containers/payments/subscription/plusToPlusHelper';
import { useAutomaticCurrency } from '../../../../payments/client-extensions/index';
import { usePaymentsApi } from '../../../../payments/react-extensions/usePaymentsApi';
import Price from '../../../price/Price';
import SkeletonLoader from '../../../skeletonLoader/SkeletonLoader';

import './components/ZeroNinetyNineOffer.scss';

interface Props {
    priceWithGradient?: boolean;
}

export const useZeroNinetyNinePromotionPrice = ({ priceWithGradient = false }: Props) => {
    const [plans] = usePlans();
    const { paymentsApi } = usePaymentsApi();
    const [currency, loadingCurrency] = useAutomaticCurrency();

    const [amount, setAmount] = useState<number>();

    useEffect(() => {
        const fetchPromotionPrice = async (curr: Currency) => {
            const planIDs = { [PLANS.MAIL]: 1 };

            const checkResult = await paymentsApi.checkSubscription({
                Plans: planIDs,
                Currency: curr,
                Cycle: CYCLE.MONTHLY,
                CouponCode: COUPON_CODES.TRYMAILPLUS0926,
            });

            const checkout = getCheckoutUi({
                planIDs,
                plansMap: getPlansMap(plans?.plans ?? [], curr, false),
                checkResult,
            });

            setAmount(checkout.withDiscountPerCycle);
        };

        if (!currency || !plans) {
            return;
        }

        void fetchPromotionPrice(currency);
    }, [currency, loadingCurrency, plans]);

    const pricingTitle = amount ? (
        <Price
            currency={currency}
            key="monthlyAmount"
            className={clsx(priceWithGradient && 'zero-ninety-nine-price-gradient')}
        >
            {amount}
        </Price>
    ) : (
        <SkeletonLoader width="3em" key="monthlyLoader" />
    );

    return {
        planName: getNormalizedPlanTitleToPlus(PLANS.MAIL),
        amountDue: amount,
        hasPrice: Boolean(amount),
        pricingTitle,
    };
};
