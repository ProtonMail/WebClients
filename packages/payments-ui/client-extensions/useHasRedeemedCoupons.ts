import { useEffect, useState } from 'react';

import { useAllSubscriptions } from '@proton/account/allSubscriptions/hooks';
import { useApi } from '@proton/app-context/useApi';
import { type CouponRedemptionsResponse, queryCouponRedemptions } from '@proton/payments/core/api/api';

interface Props {
    coupons: string[];
    enabled?: boolean;
}

interface Result {
    subscriptionsKey: string;
    couponsKey: string;
    hasRedeemed: boolean;
}

/**
 * Whether the user has redeemed any of `coupons`, read from their coupon redemption history.
 *
 * The subscription's CouponCode only carries recurring coupons, so a one-time coupon leaves no trace there
 * once it has been used. The redemption history keeps it, but the backend writes it when it processes the
 * invoice webhook, so it can lag a few seconds behind checkout.
 *
 * Refetches whenever the subscription changes. A failed request counts as not redeemed.
 */
export const useHasRedeemedCoupons = ({ coupons, enabled = true }: Props) => {
    const api = useApi();
    const [subscriptions] = useAllSubscriptions();
    const [result, setResult] = useState<Result>();

    // The endpoint treats an empty list as "every coupon", so there's nothing to ask about without codes
    const isActive = enabled && coupons.length > 0;

    // Keyed on the codes rather than the array, so a caller passing a new array each render doesn't refetch
    const couponsKey = coupons.join(',');

    // Keyed on what identifies each subscription rather than the array reference, so a purchase or plan change
    // refetches but a refetch that returns the same subscriptions doesn't
    const subscriptionsKey =
        subscriptions
            ?.map(({ ID, Cycle, PeriodEnd, Plans }) => {
                return [ID, Cycle, PeriodEnd, ...Plans.map(({ Name }) => Name)].join(':');
            })
            .join('|') ?? '';

    useEffect(() => {
        if (!isActive) {
            return;
        }

        const abortController = new AbortController();

        const getHasRedeemed = async () => {
            let hasRedeemed: boolean;

            try {
                const { Redemptions } = await api<CouponRedemptionsResponse>({
                    ...queryCouponRedemptions(couponsKey.split(',')),
                    signal: abortController.signal,
                    silence: true,
                });

                hasRedeemed = Redemptions.some(({ Redemptions: count }) => count > 0);
            } catch {
                hasRedeemed = false;
            }

            // An aborted request also lands in the catch, so it must not be stored as not redeemed
            if (!abortController.signal.aborted) {
                setResult({ subscriptionsKey, couponsKey, hasRedeemed });
            }
        };

        void getHasRedeemed();

        return () => {
            abortController.abort();
        };
    }, [isActive, couponsKey, subscriptionsKey]);

    if (!isActive) {
        return { hasRedeemed: false, loading: false };
    }

    // Until the history for the current subscription and codes arrives, report loading
    if (!result || result.subscriptionsKey !== subscriptionsKey || result.couponsKey !== couponsKey) {
        return { hasRedeemed: false, loading: true };
    }

    return { hasRedeemed: result.hasRedeemed, loading: false };
};
