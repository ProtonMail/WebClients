import { useEffect, useState } from 'react';

import { usePlans } from '@proton/account/plans/hooks';
import useLoading from '@proton/hooks/useLoading';
import { useAutomaticCurrency } from '@proton/payments-ui/client-extensions/useAutomaticCurrency';
import { usePaymentsApi } from '@proton/payments-ui/react-extensions/usePaymentsApi';
import { getCheckoutUi } from '@proton/payments/core/checkout';
import { COUPON_CODES, CYCLE, PLANS } from '@proton/payments/core/constants';
import { getPlansMap } from '@proton/payments/core/subscription/plans-map-wrapper';

const planIDs = { [PLANS.DUO]: 1 };

interface Props {
    enabled: boolean;
}

/**
 * Resolves the coupon's discount as a percentage from a live subscription check, so the navbar label
 * quotes the same number the modal badge and prices are derived from rather than a hardcoded one.
 */
export const useTryDuo2026Discount = ({ enabled }: Props) => {
    const [plansResult] = usePlans();
    const { paymentsApi } = usePaymentsApi();
    const [currency] = useAutomaticCurrency();

    const [loading, withLoading] = useLoading(enabled);
    const [discount, setDiscount] = useState<number | undefined>(undefined);

    const plans = plansResult?.plans;

    useEffect(() => {
        if (!enabled || !currency || !plans) {
            return;
        }

        const getDiscount = async () => {
            try {
                const checkResult = await paymentsApi.checkSubscription(
                    {
                        Plans: planIDs,
                        Currency: currency,
                        Cycle: CYCLE.YEARLY,
                        CouponCode: COUPON_CODES.TRYDUO2026,
                    },
                    { silence: true }
                );

                const checkout = getCheckoutUi({
                    planIDs,
                    plansMap: getPlansMap(plans, currency, false),
                    checkResult,
                });

                setDiscount(checkout.discountPercent);
            } catch {
                setDiscount(undefined);
            }
        };

        void withLoading(getDiscount);
    }, [enabled, currency, plans]);

    return { discount, loading };
};
