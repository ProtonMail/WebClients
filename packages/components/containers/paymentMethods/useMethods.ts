import { useEffect, useState } from 'react';

import { queryPaymentMethodStatus, queryPaymentMethods } from '@proton/shared/lib/api/payments';
import { Api, PaymentMethod, PaymentMethodStatus } from '@proton/shared/lib/interfaces';

import { useApi, useAuthentication, useLoading } from '../../hooks';
import { getPaymentMethodOptions } from './getPaymentMethodOptions';
import { PaymentMethodFlows } from './interface';

async function getPaymentMethods(api: Api): Promise<PaymentMethod[]> {
    const response = await api<{ PaymentMethods: PaymentMethod[] }>(queryPaymentMethods());
    return response.PaymentMethods ?? [];
}

async function getPaymentMethodStatus(api: Api): Promise<PaymentMethodStatus> {
    return api<PaymentMethodStatus>(queryPaymentMethodStatus());
}

interface Props {
    amount: number;
    coupon: string;
    flow: PaymentMethodFlows;
    paymentMethodStatus?: PaymentMethodStatus;
}

const useMethods = ({ paymentMethodStatus: maybePaymentMethodsStatus, amount, coupon, flow }: Props) => {
    const api = useApi();
    const { UID } = useAuthentication();
    const isAuthenticated = !!UID;
    const [result, setResult] = useState<{
        paymentMethods: PaymentMethod[];
        paymentMethodsStatus: Partial<PaymentMethodStatus>;
    }>({
        paymentMethods: [],
        paymentMethodsStatus: {},
    });
    const [loading, withLoading] = useLoading();

    useEffect(() => {
        const run = async () => {
            const statusPromise = maybePaymentMethodsStatus ?? getPaymentMethodStatus(api);

            const paymentMethodsPromise = isAuthenticated ? getPaymentMethods(api) : [];

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
