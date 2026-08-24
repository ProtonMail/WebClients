import { useEffect, useState } from 'react';

import { COUPON_CODES, CYCLE, PLANS } from '@proton/payments/core/constants';
import { isMainCurrency } from '@proton/payments/core/currencies';
import type { Currency } from '@proton/payments/core/interface';
import clsx from '@proton/utils/clsx';

import { getNormalizedPlanTitleToPlus } from '../../../../../containers/payments/subscription/plusToPlusHelper';
import { useRegionalPricing } from '../../../../../hooks/useRegionalPricing';
import { useAutomaticCurrency } from '../../../../../payments/client-extensions/index';
import Price from '../../../../price/Price';
import SkeletonLoader from '../../../../skeletonLoader/SkeletonLoader';
import type { SUPPORTED_PRODUCTS } from '../interface';

interface Props {
    offerProduct: SUPPORTED_PRODUCTS;
    priceWithGradient?: boolean;
}

const ONE_DOLLAR = 100;

export const usePostSignupOneDollarPromotionPrice = ({ offerProduct, priceWithGradient = false }: Props) => {
    const { fetchPrice } = useRegionalPricing();
    const [currency, loadingCurrency] = useAutomaticCurrency();

    const [amount, setAmount] = useState<number>();

    const isMail = offerProduct === 'mail';
    const plan = isMail ? PLANS.MAIL : PLANS.DRIVE;

    useEffect(() => {
        const fetchRegionalPrice = async (curr: Currency) => {
            if (isMainCurrency(curr)) {
                setAmount(ONE_DOLLAR);
                return;
            }

            const result = await fetchPrice({
                data: {
                    Plans: { [plan]: 1 },
                    Currency: currency,
                    Cycle: CYCLE.MONTHLY,
                    CouponCode: isMail ? COUPON_CODES.TRYMAILPLUS0724 : COUPON_CODES.TRYDRIVEPLUS2024,
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
        <Price currency={currency} key="monthlyAmount" className={clsx(priceWithGradient && 'fancy-gradient')}>
            {amount}
        </Price>
    ) : (
        <SkeletonLoader width="3em" key="monthlyLoader" />
    );

    const planName = getNormalizedPlanTitleToPlus(plan);

    return {
        planName,
        amountDue: amount,
        pricingTitle,
    };
};
