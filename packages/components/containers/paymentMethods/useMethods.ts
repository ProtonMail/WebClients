import { useEffect, useState } from 'react';
import { queryPaymentMethods } from 'proton-shared/lib/api/payments';

import { useApi, useLoading, useAuthentication } from '../../hooks';
import { getPaymentMethodOptions } from './getPaymentMethodOptions';
import { PaymentMethodResult } from '../payments/interface';
import { PaymentMethodFlows } from './interface';

interface Props {
    amount: number;
    coupon: string;
    type: PaymentMethodFlows;
}

const useMethods = ({ amount, coupon, type }: Props) => {
    const api = useApi();
    const { UID } = useAuthentication();
    const isAuthenticated = !!UID;
    const [methods, setMethods] = useState<PaymentMethodResult[]>([]);
    const [loading, withLoading] = useLoading();

    useEffect(() => {
        if (!isAuthenticated) {
            return;
        }
        withLoading(
            api<{ PaymentMethods: PaymentMethodResult[] }>(queryPaymentMethods()).then(({ PaymentMethods = [] }) => {
                setMethods(PaymentMethods);
            })
        );
    }, []);

    const options = getPaymentMethodOptions({ amount, coupon, type, methods });

    return {
        methods,
        loading,
        options,
    };
};

export default useMethods;
