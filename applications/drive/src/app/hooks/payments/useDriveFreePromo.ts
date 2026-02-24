import { useEffect, useState } from 'react';

import { usePaymentStatus } from '@proton/account/paymentStatus/hooks';
import { usePlans } from '@proton/account/plans/hooks';
import { useCurrencies } from '@proton/components/payments/client-extensions';
import { usePaymentsApi } from '@proton/components/payments/react-extensions/usePaymentsApi';
import { CYCLE, type CheckSubscriptionData, PLANS, type SubscriptionEstimation } from '@proton/payments';

interface UseDriveFreePromoProps {
    codes: string[] | undefined;
}

export function useDriveFreePromo({ codes }: UseDriveFreePromoProps) {
    const { getPreferredCurrency } = useCurrencies();
    const { paymentsApi } = usePaymentsApi();
    const [plansResult] = usePlans();
    const [paymentStatus] = usePaymentStatus();

    const [result, setResult] = useState<SubscriptionEstimation | null>(null);
    const [hasError, setHasError] = useState(false);
    const codesKey = codes?.join(',') ?? '';
    const currency = getPreferredCurrency({
        paymentStatus,
        plans: plansResult?.plans,
        paramPlanName: PLANS.DRIVE,
    });

    useEffect(() => {
        const fetchData = async () => {
            if (currency) {
                setHasError(false);
                const subscriptionData: CheckSubscriptionData = {
                    Plans: { [PLANS.DRIVE]: 1 },
                    Currency: currency,
                    Cycle: CYCLE.MONTHLY,
                    Codes: codesKey.split(','),
                };
                try {
                    const res = await paymentsApi.checkSubscription(subscriptionData);
                    setResult(res);
                } catch (error) {
                    setHasError(true);
                    throw error;
                }
            }
        };

        void fetchData();
        // paymentsApi is not stable
        // TODO: update the usePaymentsApi with useCallback
    }, [currency, codesKey]);

    return { promoData: result, hasError };
}
