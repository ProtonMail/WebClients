import { useEffect, useState } from 'react';

import { usePlans } from '@proton/account/plans/hooks';
import { useSubscription } from '@proton/account/subscription/hooks';
import { usePaymentsApiWithCheckFallback } from '@proton/components/payments/react-extensions/usePaymentsApi';
import { FeatureCode } from '@proton/features/interface';
import useFeature from '@proton/features/useFeature';
import useLoading from '@proton/hooks/useLoading';
import { COUPON_CODES, CYCLE, PLANS, getPlanName, getPlansMap } from '@proton/payments';
import type { Currency } from '@proton/payments';
import type { PaymentsCheckoutUI } from '@proton/payments/core/checkout';
import { getCheckoutUi } from '@proton/payments/core/checkout';
import { isDangerouslyAllowedSubscriptionEstimation } from '@proton/payments/core/subscription/helpers';

const SUPPORTED_PLANS = new Set([PLANS.MAIL, PLANS.BUNDLE]);

export interface OfferCheckResult {
    offerIsAvailable: boolean;
    isLoading: boolean;
    checkout: PaymentsCheckoutUI | undefined;
    planName: PLANS | undefined;
    cycle: CYCLE;
    currency: Currency;
    coupon: string;
}

export const useCancellationOffer = (): OfferCheckResult => {
    const [subscription] = useSubscription();
    const [plans] = usePlans();
    const { paymentsApi } = usePaymentsApiWithCheckFallback();
    const [isLoading, withIsLoading] = useLoading(true);
    const [offerIsAvailable, setOfferIsAvailable] = useState(false);
    const [checkout, setCheckout] = useState<PaymentsCheckoutUI | undefined>();
    const { feature, loading } = useFeature(FeatureCode.CanUseFeedbackFirstCancellationOffer);

    const planName = getPlanName(subscription);
    const plansData = plans?.plans;
    const cycle = subscription?.Cycle ?? CYCLE.MONTHLY;
    const isYearly = cycle === CYCLE.YEARLY;
    const currency = subscription?.Currency ?? 'USD';
    const coupon = isYearly ? COUPON_CODES.RENEWANDSAVE12M26 : COUPON_CODES.RENEWANDSAVE1M26;
    const isSupported = !!planName && SUPPORTED_PLANS.has(planName);

    useEffect(() => {
        if (!isSupported || !planName || !plansData || !feature?.Value || loading) {
            return;
        }

        const planIDs = { [planName]: 1 };

        const isAllowed = isDangerouslyAllowedSubscriptionEstimation(subscription, {
            planIDs,
            cycle,
            coupon,
        });

        if (!isAllowed) {
            setOfferIsAvailable(false);
            return;
        }

        const fetchOffer = async () => {
            try {
                const result = await paymentsApi.checkSubscription(
                    {
                        Plans: planIDs,
                        CouponCode: coupon,
                        Currency: currency,
                        Cycle: cycle,
                    },
                    { silence: true }
                );

                if (result.error) {
                    setOfferIsAvailable(false);
                    return;
                }

                const plansMap = getPlansMap(plans.plans, currency, false);
                const checkoutResult = getCheckoutUi({
                    planIDs,
                    plansMap,
                    checkResult: result,
                });

                setOfferIsAvailable(true);
                setCheckout(checkoutResult);
            } catch {
                setOfferIsAvailable(false);
            }
        };

        void withIsLoading(fetchOffer);
    }, [planName, cycle, currency, plansData, loading]);

    return {
        offerIsAvailable,
        isLoading,
        checkout,
        planName,
        cycle,
        currency,
        coupon,
    };
};
