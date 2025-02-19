import { useEffect, useState } from 'react';

import { c } from 'ttag';

import { usePlans } from '@proton/account/plans/hooks';
import { useUser } from '@proton/account/user/hooks';
import { useRegionalPricing } from '@proton/components/hooks/useRegionalPricing';
import { useAutomaticCurrency } from '@proton/components/payments/client-extensions';
import { COUPON_CODES, CYCLE, PLANS, PLAN_NAMES, getPlanByName, isMainCurrency } from '@proton/payments';
import { BRAND_NAME } from '@proton/shared/lib/constants';
import { getPricePerCycle } from '@proton/shared/lib/helpers/subscription';
import { getPlanOrAppNameText } from '@proton/shared/lib/i18n/ttag';

import { PriceCoupon, PriceLine } from './OneDollarPromoComponents';

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
    const [loading, setLoading] = useState(true);
    const [amountDue, setAmountDue] = useState<number>();

    const { fetchPrice } = useRegionalPricing();

    const [plansResult] = usePlans();

    const planID = user.isPaid ? PLANS.BUNDLE : PLANS.MAIL;
    const planName = user.isPaid ? PLAN_NAMES[PLANS.BUNDLE] : PLAN_NAMES[PLANS.MAIL];
    const plan = getPlanByName(plansResult?.plans ?? [], planID, currency);
    const cycle = user.isFree ? CYCLE.MONTHLY : CYCLE.YEARLY;
    const planPricePerCycle = getPricePerCycle(plan, cycle) ?? 0;

    useEffect(() => {
        const handleGetPlanAmount = async () => {
            const result = await fetchPrice({
                data: {
                    Plans: { [planID]: 1 },
                    Currency: currency,
                    Cycle: CYCLE.MONTHLY,
                    CouponCode: user.isFree ? COUPON_CODES.TRYMAILPLUS0724 : undefined,
                },
                defaultPrice: planPricePerCycle,
                currency,
            });

            setAmountDue(result);
        };

        // The one-dollar promo is only used for paid Mail features, a users having access to
        // paid Mail cannot benefit from it. We don't want to fetch the price for those users.
        if (user.hasPaidMail || loadingCurrency) {
            setLoading(false);
            return;
        }

        // Main currencies all have the same price, we don't need to fetch the price.
        // In those case, the default price is 100 cents
        if (isMainCurrency(currency)) {
            setAmountDue(user.isFree ? OFFER_DEFAULT_AMOUNT_DUE : planPricePerCycle);
            setLoading(false);
            return;
        }

        if (currency && !amountDue) {
            void handleGetPlanAmount()
                .then(() => {
                    setLoading(false);
                })
                .catch(() => {
                    setLoading(false);
                });
        } else {
            setLoading(false);
        }
    }, [planID, planPricePerCycle, user.hasPaidMail, currency, loadingCurrency]);

    const priceLine = user.isFree ? (
        <PriceLine currency={currency} planPrice={planPricePerCycle} />
    ) : (
        // Paid users are upsell to yearly cycle, we want monthly price so we need to divide the price by 12
        <PriceLine currency={currency} planPrice={planPricePerCycle / CYCLE.YEARLY} />
    );

    const priceCoupon = <PriceCoupon currency={currency} amountDue={amountDue} loading={loading} />;

    if (newUpsellModalVariant) {
        return {
            submitText: user.isFree
                ? c('Action').jt`Get ${planName} for ${priceCoupon}`
                : getPlanOrAppNameText(planName),
            footerText: user.isFree
                ? c('new_plans: Subtext')
                      .jt`The discounted price of ${priceCoupon} is valid for the first month. Then it will automatically be renewed at ${priceLine}. You can cancel at any time.`
                : c('new_plans: Subtext')
                      .jt`Unlock all ${BRAND_NAME} premium products and features for just ${priceLine}. Cancel anytime.`,
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
