import { useEffect, useState } from 'react';

import { useLoading } from '@proton/hooks';
import { getSilentApi } from '@proton/shared/lib/api/helpers/customConfig';
import { CreateBitcoinTokenData, createToken, getTokenStatus } from '@proton/shared/lib/api/payments';
import { MAX_BITCOIN_AMOUNT, MIN_BITCOIN_AMOUNT } from '@proton/shared/lib/constants';
import { wait } from '@proton/shared/lib/helpers/promise';
import { Api } from '@proton/shared/lib/interfaces';

import {
    AmountAndCurrency,
    PAYMENT_METHOD_TYPES,
    PAYMENT_TOKEN_STATUS,
    TokenPaymentMethod,
    isTokenPaymentMethod,
} from '../../payments/core';

export const BITCOIN_POLLING_INTERVAL = 60000;

function pause() {
    return wait(BITCOIN_POLLING_INTERVAL);
}

type TokenValidationStatus = 'chargeable' | 'pending' | 'error-token-invalid';

const useCheckStatus = ({
    api,
    token,
    onTokenValidated,
    onTokenInvalid,
    enablePolling,
}: {
    api: Api;
    token: string | null;
    onTokenValidated: (token: string) => void;
    onTokenInvalid: () => void;
    enablePolling: boolean;
}) => {
    const [paymentValidated, setPaymentValidated] = useState(false);
    const awaitingPayment = token !== null && !paymentValidated;

    useEffect(() => {
        let active = true;

        const validate = async (token: string): Promise<TokenValidationStatus> => {
            try {
                const { Status } = await api<any>(getTokenStatus(token));
                if (Status === PAYMENT_TOKEN_STATUS.STATUS_CHARGEABLE) {
                    return 'chargeable';
                }
            } catch (err: any) {
                // it happens when token expires and no longer valid
                if (err?.status === 400) {
                    return 'error-token-invalid';
                }
            }

            return 'pending';
        };

        async function run() {
            if (!token) {
                return;
            }

            await pause();
            while (active && enablePolling) {
                const status = await validate(token);
                if (status === 'chargeable' && active) {
                    setPaymentValidated(true);
                    onTokenValidated?.(token);
                    active = false;
                    break;
                }

                // stop the polling loop if the token is no longer valid
                if (status === 'error-token-invalid') {
                    active = false;
                    onTokenInvalid();
                    break;
                }

                await pause();
            }
        }

        void run();

        return () => {
            active = false;
        };
    }, [token, enablePolling]);

    return {
        paymentValidated,
        awaitingPayment,
    };
};

export interface BitcoinTokenModel {
    amountBitcoin: number;
    address: string;
    token: string | null;
    amount: number;
    currency: string | null;
}

export interface ValidatedBitcoinToken extends TokenPaymentMethod {
    cryptoAmount: number;
    cryptoAddress: string;
}

export function isValidatedBitcoinToken(paymentMethod: any): paymentMethod is ValidatedBitcoinToken {
    return (
        isTokenPaymentMethod(paymentMethod) &&
        typeof (paymentMethod as any).cryptoAmount === 'number' &&
        typeof (paymentMethod as any).cryptoAddress === 'string'
    );
}

export type OnBitcoinTokenValidated = (data: ValidatedBitcoinToken) => void;
export type OnBitcoinAwaitingPayment = (awaitingBitcoinPayment: boolean) => void;

export type UseBitcoinParams = {
    api: Api;
    onTokenValidated: OnBitcoinTokenValidated;
    onAwaitingPayment?: OnBitcoinAwaitingPayment;
    enablePolling: boolean;
} & AmountAndCurrency;

const useBitcoin = ({
    api,
    onTokenValidated,
    onAwaitingPayment,
    enablePolling,
    Amount: amount,
    Currency: currency,
}: UseBitcoinParams) => {
    const silentApi = getSilentApi(api);

    const [error, setError] = useState(false);
    const INITIAL_STATE: BitcoinTokenModel = { amountBitcoin: 0, address: '', token: null, amount: 0, currency: null };
    const [model, setModel] = useState(INITIAL_STATE);
    const [loading, withLoading] = useLoading();

    const checkStatus = useCheckStatus({
        api: silentApi,
        token: model.token,
        onTokenValidated: (token) =>
            onTokenValidated({
                Payment: {
                    Type: PAYMENT_METHOD_TYPES.TOKEN,
                    Details: {
                        Token: token,
                    },
                },
                cryptoAmount: model.amountBitcoin,
                cryptoAddress: model.address,
            }),
        onTokenInvalid: () => {
            setError(true);
            setModel(INITIAL_STATE);
            onAwaitingPayment?.(false);
        },
        enablePolling,
    });

    useEffect(() => {
        onAwaitingPayment?.(checkStatus.awaitingPayment && !loading);
    }, [checkStatus.awaitingPayment, loading]);

    const fetchAsToken = async () => {
        try {
            const data: CreateBitcoinTokenData = {
                Amount: amount,
                Currency: currency,
                Payment: {
                    Type: 'cryptocurrency',
                    Details: {
                        Coin: 'bitcoin',
                    },
                },
            };
            const { Token, Data } = await silentApi<any>(createToken(data));
            setModel({
                amountBitcoin: Data.CoinAmount,
                address: Data.CoinAddress,
                token: Token,
                amount: amount,
                currency: currency,
            });
        } catch (error) {
            setModel(INITIAL_STATE);
            throw error;
        }
    };

    const request = async () => {
        const isCorrectAmount = amount >= MIN_BITCOIN_AMOUNT && amount <= MAX_BITCOIN_AMOUNT;
        const alreadyHasToken = model.amount === amount && model.currency === currency && !!model.token;
        if (!isCorrectAmount || alreadyHasToken) {
            return;
        }

        setError(false);
        try {
            await withLoading(fetchAsToken());
        } catch {
            setError(true);
        }
    };

    return {
        model,
        loading,
        request,
        error,
        amount,
        currency,
        ...checkStatus,
    };
};

export default useBitcoin;
