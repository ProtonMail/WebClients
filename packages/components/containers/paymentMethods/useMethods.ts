import { useEffect, useState } from 'react';

import { PaymentMethodStatus, SavedPaymentMethod } from '@proton/components/payments/core';
import { useLoading } from '@proton/hooks';
import { queryPaymentMethodStatus, queryPaymentMethods } from '@proton/shared/lib/api/payments';
import { Api } from '@proton/shared/lib/interfaces';

import { getPaymentMethodOptions } from './getPaymentMethodOptions';
import { PaymentMethodFlows } from './interface';

async function getPaymentMethods(api: Api): Promise<SavedPaymentMethod[]> {
    const response = await api<{ PaymentMethods: SavedPaymentMethod[] }>(queryPaymentMethods());
    return response.PaymentMethods ?? [];
}

async function getPaymentMethodStatus(api: Api): Promise<PaymentMethodStatus> {
    return api<PaymentMethodStatus>(queryPaymentMethodStatus());
}

interface Props {
    api: Api;
    amount: number;
    coupon: string;
    flow: PaymentMethodFlows;
    paymentMethodStatus?: PaymentMethodStatus;
    paymentMethods?: SavedPaymentMethod[];
    isAuthenticated: boolean;
}

const useMethods = ({
    api,
    paymentMethodStatus: maybePaymentMethodsStatus,
    paymentMethods: maybePaymentMethods,
    amount,
    coupon,
    flow,
    isAuthenticated,
}: Props) => {
    const [result, setResult] = useState<{
        paymentMethods: SavedPaymentMethod[];
        paymentMethodsStatus: Partial<PaymentMethodStatus>;
    }>({
        paymentMethods: maybePaymentMethods || [],
        paymentMethodsStatus: maybePaymentMethodsStatus || {},
    });
    const [loading, withLoading] = useLoading(false);

    useEffect(() => {
        // Already set in state, no need to update
        if (maybePaymentMethods && maybePaymentMethodsStatus) {
            return;
        }

        const run = async () => {
            const statusPromise = maybePaymentMethodsStatus ?? getPaymentMethodStatus(api);

            const paymentMethodsPromise = maybePaymentMethods ?? (isAuthenticated ? getPaymentMethods(api) : []);

            const [paymentMethodsStatus, paymentMethods] = await Promise.all([statusPromise, paymentMethodsPromise]);

            setResult({
                paymentMethods,
                paymentMethodsStatus,
            });
        };

        withLoading(run());
    }, []);

    const options = getPaymentMethodOptions({
        amount,
        coupon,
        flow,
        paymentMethods: result.paymentMethods,
        paymentMethodsStatus: result.paymentMethodsStatus,
    });

    return {
        paymentMethods: result.paymentMethods,
        loading,
        options,
    };
};

export default useMethods;
