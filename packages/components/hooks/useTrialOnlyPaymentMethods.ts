import { useEffect, useState } from 'react';

import { useAllSubscriptions } from '@proton/account/allSubscriptions/hooks';
import { useGetPaymentMethods } from '@proton/account/paymentMethods/hooks';
import type { SavedPaymentMethod } from '@proton/payments/core/interface';
import { isTrial } from '@proton/payments/core/subscription/helpers';

/**
 * Hook that fetches payment methods only when the user is in a trial.
 * Returns a boolean indicating whether the trial user has payment methods.
 */
export const useTrialOnlyPaymentMethods = (): boolean => {
    const [subscriptions] = useAllSubscriptions();
    const getPaymentMethods = useGetPaymentMethods();
    const [paymentMethods, setPaymentMethods] = useState<SavedPaymentMethod[]>([]);

    useEffect(() => {
        const fetchPaymentMethodsIfTrial = async () => {
            if (subscriptions?.some((subscription) => isTrial(subscription))) {
                try {
                    const methods = await getPaymentMethods();
                    setPaymentMethods(methods);
                } catch {
                    setPaymentMethods([]);
                }
            }
        };

        void fetchPaymentMethodsIfTrial();
    }, [subscriptions, getPaymentMethods]);

    return paymentMethods.length > 0;
};
