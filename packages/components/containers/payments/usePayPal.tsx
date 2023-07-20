import { useState } from 'react';

import { ensureTokenChargeable } from '@proton/components/payments/client-extensions';
import { PAYMENT_METHOD_TYPES } from '@proton/components/payments/core';
import { useLoading } from '@proton/hooks';
import { createToken } from '@proton/shared/lib/api/payments';
import { Api, Currency } from '@proton/shared/lib/interfaces';

import { useModals } from '../../hooks';
import { AmountAndCurrency, TokenPaymentMethod } from '../../payments/core/interface';
import PaymentVerificationModal from './PaymentVerificationModal';

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
    onToken: () => Promise<Model>;
    onVerification: (model?: Model) => Promise<void>;
    clear: () => void;
}

type PAYPAL_PAYMENT_METHOD = PAYMENT_METHOD_TYPES.PAYPAL | PAYMENT_METHOD_TYPES.PAYPAL_CREDIT;

export type OnPayResult = TokenPaymentMethod & AmountAndCurrency & { type: PAYPAL_PAYMENT_METHOD };

interface Props {
    api: Api;
    amount: number;
    currency: Currency;
    type: PAYPAL_PAYMENT_METHOD;
    onPay: (data: OnPayResult) => void;
    onValidate?: () => boolean;
    onError?: (error: any) => void;
    /**
     * This lifecycle hook is called before the payment token is fetched.
     * It can be convinient if you need to fullfill some codition before fetching the token.
     * For example, if you want to perform authentication before fetching the token.
     * Make sure to disable paypal token prefetching in other components.
     *
     * @returns {Promise<unknown> | unknown} If a promise is returned, the token fetching will be delayed
     * until the promise is resolved.
     */
    onBeforeTokenFetch?: () => Promise<unknown> | unknown;
}

const usePayPal = ({
    api,
    amount = 0,
    currency: Currency,
    type: Type,
    onPay,
    onValidate,
    onError,
    onBeforeTokenFetch,
}: Props) => {
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
            return result;
        } catch (error: any) {
            clear();
            throw error;
        }
    };

    const onVerification = async ({ Token, ApprovalURL, ReturnHost }: Model = model) => {
        const tokenPaymentMethod = await new Promise<TokenPaymentMethod>((resolve, reject) => {
            const onProcess = () => {
                const abort = new AbortController();
                return {
                    promise: ensureTokenChargeable({
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
                    token={Token}
                    onSubmit={resolve}
                    onClose={reject}
                    type={Type}
                    onProcess={onProcess}
                    initialProcess={onProcess()}
                />
            );
        });

        onPay({ ...tokenPaymentMethod, Amount: amount, Currency, type: Type });
    };

    return {
        isReady: !!model.Token,
        loadingToken,
        loadingVerification,
        onToken: () => {
            let tokenPromise: Promise<Model>;
            const beforeTokenFetchResult = onBeforeTokenFetch?.();
            if (beforeTokenFetchResult instanceof Promise) {
                tokenPromise = beforeTokenFetchResult.then(onToken);
            } else {
                tokenPromise = onToken();
            }

            withLoadingToken(tokenPromise);
            return tokenPromise;
        },
        onVerification: async (model?: Model) => {
            if (!(onValidate?.() ?? true)) {
                return;
            }
            return withLoadingVerification(onVerification(model)).catch((e) => {
                onError?.(e);
                throw e;
            });
        },
        clear,
    };
};

export default usePayPal;
