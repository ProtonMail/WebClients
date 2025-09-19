import { useEffect, useState } from 'react';

import { useGetPaymentMethods } from '@proton/account/paymentMethods/hooks';
import { useSubscription } from '@proton/account/subscription/hooks';
import type { SavedPaymentMethod } from '@proton/payments';
import { isTrial } from '@proton/payments';

/**
 * Hook that fetches payment methods only when the user is in a trial.
 * Returns a boolean indicating whether the trial user has payment methods.
 */
export const useTrialOnlyPaymentMethods = (): boolean => {
    const [subscription] = useSubscription();
    const getPaymentMethods = useGetPaymentMethods();
    const [paymentMethods, setPaymentMethods] = useState<SavedPaymentMethod[]>([]);

    useEffect(() => {
        const fetchPaymentMethodsIfTrial = async () => {
            if (isTrial(subscription)) {
                try {
                    const methods = await getPaymentMethods();
                    setPaymentMethods(methods);
                } catch (error) {
                    setPaymentMethods([]);
                }
            }
        };

        void fetchPaymentMethodsIfTrial();
    }, [subscription, getPaymentMethods]);

    return paymentMethods.length > 0;
};
