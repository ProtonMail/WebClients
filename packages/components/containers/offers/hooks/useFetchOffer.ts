import { useEffect, useState } from 'react';

import { usePlans } from '@proton/account/plans/hooks';
import { useSubscription } from '@proton/account/subscription/hooks';
import useConfig from '@proton/components/hooks/useConfig';
import { usePaymentsApiWithCheckFallback } from '@proton/components/payments/react-extensions/usePaymentsApi';
import { useLoading } from '@proton/hooks';
import { type Currency, getPlansMap } from '@proton/payments';
import { getCheckoutRenewNoticeTextFromCheckResult } from '@proton/payments/ui/components/RenewalNotice';

import { fetchDealPrices } from '../helpers/dealPrices';
import type { Offer, OfferConfig } from '../interface';

interface Props {
    offerConfig: OfferConfig | undefined;
    currency: Currency;
    onSuccess?: () => void;
    onError?: () => void;
}

function useFetchOffer({ offerConfig, currency, onSuccess, onError }: Props) {
    const { paymentsApi } = usePaymentsApiWithCheckFallback();
    const [loading, withLoading] = useLoading();
    const [state, setState] = useState<Partial<{ offer: Offer; offerConfig: OfferConfig }>>();
    const [plansResult, plansLoading] = usePlans();
    const plans = plansResult?.plans;
    const [subscription] = useSubscription();
    const { APP_NAME } = useConfig();
    const plansMap = plans ? getPlansMap(plans, currency, false) : {};
    const [hasEstimationError, setHasEstimationError] = useState(false);
    const [initialized, setInitialized] = useState(false);

    useEffect(() => {
        if (!offerConfig || !plans) {
            return;
        }

        const updateOfferPrices = async () => {
            try {
                // Reset previous offer prices in case the offer config has changed from what was previously cached
                if (state?.offerConfig !== offerConfig) {
                    setState(undefined);
                }

                const result = await fetchDealPrices(paymentsApi, offerConfig, currency, plans);

                // We make an offer based on offerConfig + fetched results above
                const offer: Offer = {
                    ...offerConfig,
                    deals: offerConfig.deals.map((deal, index) => {
                        const [withCoupon, withoutCoupon, withoutCouponMonthly] = result[index];
                        const renew = getCheckoutRenewNoticeTextFromCheckResult({
                            checkResult: withCoupon,
                            planIDs: deal.planIDs,
                            subscription,
                            plansMap,
                            app: APP_NAME,
                        }) as string;

                        // In long-term, we might encounter 2 types of errors: recoverable and non-recoverable.
                        // Recoverable errors are treated in the frontend payments network layer, they don't throw an
                        // error. In this if condition, we check if a recoverable error exists. Even though it's not
                        // catastrophic, the SubscriptionEstimation is still unusable for the purpose of displaying the
                        // offer.
                        if (withCoupon.error) {
                            setHasEstimationError(true);
                        }

                        return {
                            ...deal,
                            renew,
                            prices: {
                                withCoupon: withCoupon.Amount + (withCoupon.CouponDiscount || 0),
                                withoutCoupon: withoutCoupon.Amount + (withoutCoupon.CouponDiscount || 0), // BUNDLE discount can be applied
                                // in rare cases a plan doesn't have a monthly price, so we use 0 as a fallback.
                                // It can be potentially done smarter, e.g. take the amount without coupon and devide it
                                // byt the cycle length. But that wasn't required for the purpose of Pass Lifetime offer
                                withoutCouponMonthly: withoutCouponMonthly?.Amount ?? 0,
                            },
                        };
                    }),
                };
                setState({ offer, offerConfig });
                onSuccess?.();
            } catch (error) {
                onError?.();
                // If the error is not recoverable, we set the flag to true to prevent the offer from being displayed.
                setHasEstimationError(true);
            } finally {
                setInitialized(true);
            }
        };

        void withLoading(updateOfferPrices());
    }, [offerConfig, currency, plans]);

    return {
        offer: state?.offer,
        loading: loading || plansLoading,
        hasEstimationError,
        initialized,
    };
}

export default useFetchOffer;
