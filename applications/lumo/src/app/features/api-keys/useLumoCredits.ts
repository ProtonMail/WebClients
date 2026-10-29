import { useEffect, useState } from 'react';

import { useApi } from '@proton/app-context/useApi';
import { type LumoCreditResponse, getLumoCreditConfig } from '@proton/payments/core/api/lumoCredit';

const getBalance = (response?: LumoCreditResponse) => {
    if (!response?.Balance) {
        return undefined;
    }
    const balance = Number(response.Balance);
    return Number.isFinite(balance) ? balance : undefined;
};

export const useLumoCredits = () => {
    const api = useApi();
    const [{ response, error }, setState] = useState<{ response?: LumoCreditResponse; error?: unknown }>({});

    useEffect(() => {
        void api<LumoCreditResponse>({ ...getLumoCreditConfig(), silence: true }).then(
            (response) => setState({ response }),
            (error) => setState({ error })
        );
    }, []);

    return {
        balance: getBalance(response),
        loading: !response && !error,
        error,
    };
};
