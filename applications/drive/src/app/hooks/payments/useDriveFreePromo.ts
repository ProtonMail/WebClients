import { useEffect, useMemo, useState } from 'react';

import { usePaymentStatus } from '@proton/account/paymentStatus/hooks';
import { usePlans } from '@proton/account/plans/hooks';
import { useCurrencies } from '@proton/components/payments/client-extensions';
import { usePaymentsApi } from '@proton/components/payments/react-extensions/usePaymentsApi';
import { CYCLE, type CheckSubscriptionData, type EnrichedCheckResponse, PLANS } from '@proton/payments';

import { usePublicSessionUser } from '../../store';

interface UseDriveFreePromoProps {
    codes: string[] | undefined;
}

export function useDriveFreePromo({ codes }: UseDriveFreePromoProps) {
    const { user } = usePublicSessionUser();
    const { getPreferredCurrency } = useCurrencies();
    const { paymentsApi } = usePaymentsApi();
    const [plansResult] = usePlans();
    const [paymentStatus] = usePaymentStatus();

    const [result, setResult] = useState<EnrichedCheckResponse | null>(null);
    const [hasError, setHasError] = useState(false);
    const codesKey = useMemo(() => codes?.join(',') ?? '', [codes]);
    const currency = getPreferredCurrency({
        user,
        paymentStatus,
        plans: plansResult?.plans,
        paramPlanName: PLANS.DRIVE,
    });

    useEffect(() => {
        const fetchData = async () => {
            if (plansResult?.plans && paymentStatus && currency) {
                setHasError(false);
                const subscriptionData: CheckSubscriptionData = {
                    Plans: { [PLANS.DRIVE]: 1 },
                    Currency: currency,
                    Cycle: CYCLE.MONTHLY,
                    Codes: codes,
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
    }, [currency, codesKey]);

    return { promoData: result, hasError };
}
