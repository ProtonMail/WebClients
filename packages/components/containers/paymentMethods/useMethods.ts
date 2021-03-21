import { useEffect, useState } from 'react';
import { queryPaymentMethods } from 'proton-shared/lib/api/payments';
import { PaymentMethod } from 'proton-shared/lib/interfaces';

import { useApi, useLoading, useAuthentication } from '../../hooks';
import { getPaymentMethodOptions } from './getPaymentMethodOptions';
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
    const [methods, setMethods] = useState<PaymentMethod[]>([]);
    const [loading, withLoading] = useLoading();

    useEffect(() => {
        if (!isAuthenticated) {
            return;
        }
        withLoading(
            api<{ PaymentMethods: PaymentMethod[] }>(queryPaymentMethods()).then(({ PaymentMethods = [] }) => {
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
