import { useEffect, useState } from 'react';

import Price from '@proton/components/components/price/Price';
import SkeletonLoader from '@proton/components/components/skeletonLoader/SkeletonLoader';
import { getNormalizedPlanTitleToPlus } from '@proton/components/containers/payments/subscription/plusToPlusHelper';
import { useRegionalPricing } from '@proton/components/hooks/useRegionalPricing';
import { useAutomaticCurrency } from '@proton/components/payments/client-extensions';
import { COUPON_CODES, CYCLE, type Currency, PLANS, isMainCurrency } from '@proton/payments';
import clsx from '@proton/utils/clsx';

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
