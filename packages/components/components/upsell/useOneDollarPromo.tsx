import { useEffect, useState } from 'react';

import { c } from 'ttag';

import { usePlans } from '@proton/account/plans/hooks';
import { useUser } from '@proton/account/user/hooks';
import { CircleLoader } from '@proton/atoms/index';
import Price from '@proton/components/components/price/Price';
import { useRegionalPricing } from '@proton/components/hooks/useRegionalPricing';
import { useAutomaticCurrency } from '@proton/components/payments/client-extensions';
import { useLoading } from '@proton/hooks';
import { CYCLE, PLANS, PLAN_NAMES, getPlanByName, isMainCurrency } from '@proton/payments';
import { BRAND_NAME, COUPON_CODES } from '@proton/shared/lib/constants';
import { getPricePerCycle } from '@proton/shared/lib/helpers/subscription';
import { getPlanOrAppNameText } from '@proton/shared/lib/i18n/ttag';

const OFFER_DEFAULT_AMOUNT_DUE = 100;

interface Props {
    newUpsellModalVariant?: boolean;
}

/**
 * Offers a $1 promo to free users
 * And a normal Unlimited upsell for the paid users.
 * We can't offer $1 Mail Plus to paid users as it might override their existing
 * subscription (e.g. VPN Plus).
 */
const useOneDollarConfig = ({ newUpsellModalVariant = false }: Props) => {
    const [user] = useUser();
    const [currency, loadingCurrency] = useAutomaticCurrency();
    const [loading, withLoading] = useLoading(true);
    const [amountDue, setAmountDue] = useState<number>();

    const { fetchPrice } = useRegionalPricing();

    const [plansResult] = usePlans();

    const planID = user.isPaid ? PLANS.BUNDLE : PLANS.MAIL;
    const planName = user.isPaid ? PLAN_NAMES[PLANS.BUNDLE] : PLAN_NAMES[PLANS.MAIL];
    const plan = getPlanByName(plansResult?.plans ?? [], planID, currency);
    const cycle = user.isFree ? CYCLE.MONTHLY : CYCLE.YEARLY;
    const planPricePerMonth = getPricePerCycle(plan, cycle) ?? 0;

    useEffect(() => {
        const handleGetPlanAmount = async () => {
            if (plan && currency && !loadingCurrency && !amountDue) {
                // For USD, CHF and EUR, default value is "1 dollar"
                if (isMainCurrency(currency)) {
                    setAmountDue(user.isFree ? OFFER_DEFAULT_AMOUNT_DUE : planPricePerMonth);
                    return;
                }

                const result = await fetchPrice({
                    data: {
                        Plans: { [planID]: 1 },
                        Currency: currency,
                        Cycle: CYCLE.MONTHLY,
                        CouponCode: user.isFree ? COUPON_CODES.TRYMAILPLUS0724 : undefined,
                    },
                    defaultPrice: planPricePerMonth,
                    currency,
                });

                setAmountDue(result);
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

    if (newUpsellModalVariant) {
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
