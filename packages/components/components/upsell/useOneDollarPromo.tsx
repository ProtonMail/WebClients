import { useEffect, useState } from 'react';

import { c } from 'ttag';

import { usePlans } from '@proton/account/plans/hooks';
import { useUser } from '@proton/account/user/hooks';
import { CircleLoader } from '@proton/atoms/index';
import Price from '@proton/components/components/price/Price';
import { useAutomaticCurrency } from '@proton/components/payments/client-extensions';
import { usePaymentsApi } from '@proton/components/payments/react-extensions/usePaymentsApi';
import { useLoading } from '@proton/hooks/index';
import { PLANS, PLAN_NAMES, getPlanByName } from '@proton/payments';
import { BRAND_NAME, COUPON_CODES, CYCLE } from '@proton/shared/lib/constants';
import { useNewUpsellModalVariant } from '@proton/shared/lib/helpers/upsell';
import { getPlanOrAppNameText } from '@proton/shared/lib/i18n/ttag';

const OFFER_DEFAULT_AMOUNT_DUE = 100;

/**
 * Offers a $1 promo to free users
 * And a normal Unlimited upsell for the paid users.
 * We can't offer $1 Mail Plus to paid users as it might override their existing
 * subscription (e.g. VPN Plus).
 */
const useOneDollarConfig = () => {
    const [user] = useUser();
    const [currency, loadingCurrency] = useAutomaticCurrency();
    const displayNewUpsellModalsVariant = useNewUpsellModalVariant();
    const { paymentsApi } = usePaymentsApi();
    const [loading, withLoading] = useLoading(true);
    const [amountDue, setAmountDue] = useState<number>();

    const [plansResult] = usePlans();

    let planName = PLAN_NAMES[PLANS.MAIL];
    let planID: PLANS = PLANS.MAIL;
    if (user.isPaid) {
        planID = PLANS.BUNDLE;
        planName = PLAN_NAMES[PLANS.BUNDLE];
    }
    const plan = getPlanByName(plansResult?.plans ?? [], planID, currency);
    const cycle = user.isFree ? CYCLE.MONTHLY : CYCLE.YEARLY;
    const planPricePerMonth = (plan?.Pricing?.[cycle] || 0) / cycle;

    useEffect(() => {
        const handleGetPlanAmount = async () => {
            if (plan && currency && !loadingCurrency && !amountDue) {
                // For USD, CHF and EUR, default value is "1 dollar"
                const isDefaultAmountDue = ['USD', 'CHF', 'EUR'].includes(currency);
                if (isDefaultAmountDue) {
                    setAmountDue(user.isFree ? OFFER_DEFAULT_AMOUNT_DUE : planPricePerMonth);
                    return;
                }

                try {
                    const { AmountDue } = await paymentsApi.checkWithAutomaticVersion({
                        Plans: { [planID]: 1 },
                        Currency: currency,
                        Cycle: CYCLE.MONTHLY,
                        CouponCode: user.isFree ? COUPON_CODES.TRYMAILPLUS0724 : undefined,
                    });
                    setAmountDue(AmountDue);
                } catch (e) {
                    // If request fails, default on plan full price
                    setAmountDue(planPricePerMonth);
                }
            }
        };

        void withLoading(handleGetPlanAmount);
    }, [plan, currency, loadingCurrency]);

    const priceMailPlus = (
        <Price
            key="monthly-price"
            currency={currency}
            suffix={c('specialoffer: Offers').t`/month`}
            isDisplayedInSentence
        >
            {planPricePerMonth}
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
            submitText: user.isFree
                ? c('Action').jt`Get ${planName} for ${priceCoupon}`
                : getPlanOrAppNameText(planName),
            footerText: user.isFree
                ? c('new_plans: Subtext')
                      .jt`The discounted price of ${priceCoupon} is valid for the first month. Then it will automatically be renewed at ${priceMailPlus}. You can cancel at any time.`
                : c('new_plans: Subtext')
                      .jt`Unlock all ${BRAND_NAME} premium products and features for just ${priceMailPlus}. Cancel anytime.`,
            cycle,
            coupon: user.isFree ? COUPON_CODES.TRYMAILPLUS0724 : undefined,
            planIDs: {
                [planID]: 1,
            },
        };
    }

    return {
        submitText: user.isFree
            ? c('new_plans: Action').jt`Get started for ${priceCoupon}`
            : c('new_plans: Action').t`Upgrade`,
        title: user.isFree ? c('Action').jt`Get ${planName} for ${priceCoupon}` : getPlanOrAppNameText(planName),
        cycle,
        coupon: user.isFree ? COUPON_CODES.TRYMAILPLUS0724 : undefined,
        planIDs: {
            [planID]: 1,
        },
    };
};

export default useOneDollarConfig;
