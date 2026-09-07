import { useEffect, useState } from 'react';

import { COUPON_CODES, CYCLE, PLANS } from '@proton/payments/core/constants';
import { isMainCurrency } from '@proton/payments/core/currencies';
import type { Currency } from '@proton/payments/core/interface';
import clsx from '@proton/utils/clsx';

import { getNormalizedPlanTitleToPlus } from '../../../../containers/payments/subscription/plusToPlusHelper';
import { useRegionalPricing } from '../../../../hooks/useRegionalPricing';
import { useAutomaticCurrency } from '../../../../payments/client-extensions/index';
import Price from '../../../price/Price';
import SkeletonLoader from '../../../skeletonLoader/SkeletonLoader';
import { ZERO_NINETY_NINE_AMOUNT } from './interface';

import './components/ZeroNinetyNineOffer.scss';

interface Props {
    priceWithGradient?: boolean;
}

export const useZeroNinetyNinePromotionPrice = ({ priceWithGradient = false }: Props) => {
    const { fetchPrice } = useRegionalPricing();
    const [currency, loadingCurrency] = useAutomaticCurrency();

    const [amount, setAmount] = useState<number>();

    useEffect(() => {
        const fetchRegionalPrice = async (curr: Currency) => {
            if (isMainCurrency(curr)) {
                setAmount(ZERO_NINETY_NINE_AMOUNT);
                return;
            }

            const result = await fetchPrice({
                data: {
                    Plans: { [PLANS.MAIL]: 1 },
                    Currency: curr,
                    Cycle: CYCLE.MONTHLY,
                    CouponCode: COUPON_CODES.TRYMAILPLUS0926,
                },
                currency: curr,
            });

            setAmount(result);
        };

        if (!currency) {
            return;
        }

        void fetchRegionalPrice(currency);
    }, [currency, loadingCurrency]);

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
        pricingTitle,
    };
};
