import { useEffect, useState } from 'react';

import { usePlans } from '@proton/account/plans/hooks';
import Price from '@proton/components/components/price/Price';
import SkeletonLoader from '@proton/components/components/skeletonLoader/SkeletonLoader';
import { useRegionalPricing } from '@proton/components/hooks/useRegionalPricing';
import { useAutomaticCurrency } from '@proton/components/payments/client-extensions';
import { COUPON_CODES, CYCLE, type Currency, PLANS, getPlanByName } from '@proton/payments';
import clsx from '@proton/utils/clsx';

import type { SUPPORTED_PRODUCTS } from '../interface';

interface Props {
    offerProduct: SUPPORTED_PRODUCTS;
    priceWithGradient?: boolean;
}

export const usePostSignupOneDollarPromotionPrice = ({ offerProduct, priceWithGradient = false }: Props) => {
    const [plansResult] = usePlans();
    const { fetchPrice } = useRegionalPricing();
    const [currency, loadingCurrency] = useAutomaticCurrency();

    const [amountDue, setAmountDue] = useState<number>();

    const mailPlus = getPlanByName(plansResult?.plans ?? [], PLANS.MAIL, currency);
    const mailPlusPrice = mailPlus?.Pricing?.[CYCLE.MONTHLY] || 0;

    const drivePlus = getPlanByName(plansResult?.plans ?? [], PLANS.DRIVE, currency);
    const drivePlusPrice = drivePlus?.Pricing?.[CYCLE.MONTHLY] || 0;

    const isMail = offerProduct === 'mail';

    useEffect(() => {
        const fetchRegionalPrice = async (curr: Currency) => {
            const result = await fetchPrice({
                data: {
                    Plans: { [isMail ? PLANS.MAIL : PLANS.DRIVE]: 1 },
                    Currency: currency,
                    Cycle: CYCLE.MONTHLY,
                    CouponCode: isMail ? COUPON_CODES.TRYMAILPLUS0724 : COUPON_CODES.TRYDRIVEPLUS2024,
                },
                defaultPrice: isMail ? mailPlusPrice : drivePlusPrice,
                currency: curr,
                expectedPrice: 100,
            });

            setAmountDue(result);
        };

        if (!currency) {
            return;
        }

        void fetchRegionalPrice(currency);
    }, [mailPlus, drivePlus, currency, loadingCurrency]);

    const pricingTitle = amountDue ? (
        <Price currency={currency} key="monthlyAmount" className={clsx(priceWithGradient && 'fancy-gradient')}>
            {amountDue}
        </Price>
    ) : (
        <SkeletonLoader width="3em" key="monthlyLoader" />
    );

    return {
        amountDue,
        pricingTitle,
    };
};
