import React, { useState } from 'react';
import { createToken } from 'proton-shared/lib/api/payments';
import { PAYMENT_METHOD_TYPE } from 'proton-shared/lib/constants';

import PaymentVerificationModal from './PaymentVerificationModal';
import { process } from './paymentTokenHelper';
import { useApi, useLoading, useModals } from '../../hooks';

interface Model {
    Token: string;
    ApprovalURL: string;
    ReturnHost: string;
}

const DEFAULT_MODEL = {
    Token: '',
    ApprovalURL: '',
    ReturnHost: '',
};

export interface PayPalHook {
    isReady: boolean;
    loadingToken: boolean;
    loadingVerification: boolean;
    onToken: () => Promise<void>;
    onVerification: () => Promise<void>;
    clear: () => void;
}

interface Props {
    amount: number;
    currency: string;
    type: PAYMENT_METHOD_TYPE;
    onPay: (data: any) => void;
}

const usePayPal = ({ amount = 0, currency: Currency = '', type: Type, onPay }: Props) => {
    const api = useApi();
    const [model, setModel] = useState<Model>(DEFAULT_MODEL);
    const [loadingVerification, withLoadingVerification] = useLoading();
    const [loadingToken, withLoadingToken] = useLoading();
    const { createModal } = useModals();
    const clear = () => setModel(DEFAULT_MODEL);

    const onToken = async () => {
        try {
            const result = await api<{ Token: string; ApprovalURL: string; ReturnHost: string }>(
                createToken({
                    Amount: amount,
                    Currency,
                    Payment: { Type },
                })
            );
            setModel(result);
        } catch (error) {
            clear();
            throw error;
        }
    };

    const onVerification = async () => {
        const { Token, ApprovalURL, ReturnHost } = model;
        const result = await new Promise((resolve, reject) => {
            const onProcess = () => {
                const abort = new AbortController();
                return {
                    promise: process({
                        Token,
                        api,
                        ReturnHost,
                        ApprovalURL,
                        signal: abort.signal,
                    }),
                    abort,
                };
            };
            createModal(
                <PaymentVerificationModal
                    params={{ Amount: amount, Currency }}
                    token={Token}
                    onSubmit={resolve}
                    onClose={reject}
                    type={Type}
                    onProcess={onProcess}
                    initialProcess={onProcess()}
                />
            );
        });
        onPay(result);
    };

    return {
        isReady: !!model.Token,
        loadingToken,
        loadingVerification,
        onToken: () => withLoadingToken(onToken()),
        onVerification: () => withLoadingVerification(onVerification()),
        clear,
    };
};

export default usePayPal;
