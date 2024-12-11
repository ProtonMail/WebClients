import { useEffect, useState } from 'react';

import { c } from 'ttag';

import { usePlans } from '@proton/account/plans/hooks';
import { CircleLoader } from '@proton/atoms/index';
import Price from '@proton/components/components/price/Price';
import { useAutomaticCurrency } from '@proton/components/payments/client-extensions';
import { usePaymentsApi } from '@proton/components/payments/react-extensions/usePaymentsApi';
import { useLoading } from '@proton/hooks/index';
import { PLANS, getPlanByName } from '@proton/payments';
import { COUPON_CODES, CYCLE, MAIL_SHORT_APP_NAME } from '@proton/shared/lib/constants';
import { useNewUpsellModalVariant } from '@proton/shared/lib/helpers/upsell';

const OFFER_DEFAULT_AMOUNT_DUE = 100;

const useOneDollarConfig = () => {
    const [currency, loadingCurrency] = useAutomaticCurrency();
    const displayNewUpsellModalsVariant = useNewUpsellModalVariant();
    const { paymentsApi } = usePaymentsApi();
    const [loading, withLoading] = useLoading(true);
    const [amountDue, setAmountDue] = useState<number>();

    const [plansResult] = usePlans();
    const mailPlus = getPlanByName(plansResult?.plans ?? [], PLANS.MAIL, currency);

    const mailPlusPrice = mailPlus?.Pricing?.[CYCLE.MONTHLY] || 0;

    useEffect(() => {
        const handleGetPlanAmount = async () => {
            if (mailPlus && currency && !loadingCurrency && !amountDue) {
                // For USD, CHF and EUR, default value is "1 dollar"
                const isDefaultAmountDue = ['USD', 'CHF', 'EUR'].includes(currency);
                if (isDefaultAmountDue) {
                    setAmountDue(OFFER_DEFAULT_AMOUNT_DUE);
                    return;
                }

                await paymentsApi
                    .checkWithAutomaticVersion({
                        Plans: { [PLANS.MAIL]: 1 },
                        Currency: currency,
                        Cycle: CYCLE.MONTHLY,
                        CouponCode: COUPON_CODES.TRYMAILPLUS0724,
                    })
                    .then(({ AmountDue }) => {
                        setAmountDue(AmountDue);
                    })
                    .catch(() => {
                        // If request fails, default on plan full price
                        setAmountDue(mailPlusPrice);
                    });
            }
        };

        void withLoading(handleGetPlanAmount);
    }, [mailPlus, currency, loadingCurrency]);

    const priceMailPlus = (
        <Price
            key="monthly-price"
            currency={currency}
            suffix={c('specialoffer: Offers').t`/month`}
            isDisplayedInSentence
        >
            {mailPlusPrice}
        </Price>
    );

    const priceCoupon =
        !loading && amountDue ? (
            <Price currency={currency} key="monthlyAmount">
                {amountDue}
            </Price>
        ) : (
            <CircleLoader size="small" />
        );

    if (displayNewUpsellModalsVariant) {
        return {
            submitText: c('Action').jt`Get ${MAIL_SHORT_APP_NAME} Plus for ${priceCoupon}`,
            footerText: c('new_plans: Title')
                .jt`The discounted price of ${priceCoupon} is valid for the first month. Then it will automatically be renewed at ${priceMailPlus}. You can cancel at any time.`,
            cycle: CYCLE.MONTHLY,
            coupon: COUPON_CODES.TRYMAILPLUS0724,
        };
    }

    return {
        submitText: c('new_plans: Action').jt`Get started for ${priceCoupon}`,
        title: c('new_plans: Title').jt`Get Mail Plus for ${priceCoupon}`,
        cycle: CYCLE.MONTHLY,
        coupon: COUPON_CODES.TRYMAILPLUS0724,
    };
};

export default useOneDollarConfig;
