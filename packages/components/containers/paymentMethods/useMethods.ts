import { useEffect, useState } from 'react';
import { getPaymentMethodStatus, queryPaymentMethods } from 'proton-shared/lib/api/payments';
import { PaymentMethod, PaymentMethodStatus } from 'proton-shared/lib/interfaces';

import { useApi, useLoading, useAuthentication } from '../../hooks';
import { getPaymentMethodOptions } from './getPaymentMethodOptions';
import { PaymentMethodFlows } from './interface';

interface Props {
    amount: number;
    coupon: string;
    flow: PaymentMethodFlows;
}

const useMethods = ({ amount, coupon, flow }: Props) => {
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
            const [paymentMethodsStatus, paymentMethods] = await Promise.all([
                api<PaymentMethodStatus>(getPaymentMethodStatus()),
                isAuthenticated
                    ? api<{ PaymentMethods: PaymentMethod[] }>(queryPaymentMethods()).then(
                          ({ PaymentMethods = [] }) => PaymentMethods
                      )
                    : [],
            ]);
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
