import { useEffect, useState } from 'react';

import { useLoading } from '@proton/hooks';
import { getMaxBitcoinAmount, getMinBitcoinAmount } from '@proton/payments/core/amount-limits';
import { type CreateBitcoinTokenData, createToken, getTokenStatusV5 } from '@proton/payments/core/api/api';
import type { BillingAddress } from '@proton/payments/core/billing-address/billing-address';
import { PAYMENT_METHOD_TYPES, PAYMENT_TOKEN_STATUS } from '@proton/payments/core/constants';
import type { AmountAndCurrency, ChargeablePaymentParameters, Currency } from '@proton/payments/core/interface';
import type { PaymentProcessorHook } from '@proton/payments/core/payment-processors/interface';
import { getSilentApi } from '@proton/shared/lib/api/helpers/customConfig';
import { wait } from '@proton/shared/lib/helpers/promise';
import type { Api } from '@proton/shared/lib/interfaces';

export const BITCOIN_POLLING_INTERVAL = 10000;

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
                const { Status } = await api<any>(getTokenStatusV5(token));
                if (Status === PAYMENT_TOKEN_STATUS.CHARGEABLE) {
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
                    if (!paymentValidated) {
                        setPaymentValidated(true);
                        onTokenValidated?.(token);
                    }

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
    }, [token, enablePolling, onTokenValidated, onTokenInvalid, api, paymentValidated]);

    return {
        bitcoinPaymentValidated: paymentValidated,
        awaitingPayment,
    };
};

interface BitcoinTokenModel {
    amountBitcoin: number;
    address: string;
    token: string | null;
    amount: number;
    currency: string | null;
    countryCode: string | null;
    state: string | null;
    zipCode: string | null;
}

export type OnBitcoinTokenValidated = (data: ChargeablePaymentParameters) => Promise<any>;

type UseBitcoinParams = {
    api: Api;
    onTokenValidated: OnBitcoinTokenValidated;
    enablePolling: boolean;
    billingAddress?: BillingAddress;
} & AmountAndCurrency;

export interface BitcoinHook extends PaymentProcessorHook {
    model: BitcoinTokenModel;
    loading: boolean;
    request: () => Promise<void>;
    error: boolean;
    amount: number;
    currency: Currency;
    awaitingBitcoinPayment: boolean;
    bitcoinLoading: boolean;
    processingBitcoinToken: boolean;
    bitcoinPaymentValidated: boolean;
    billingAddress?: BillingAddress;
}

const useBitcoin = ({
    api,
    onTokenValidated,
    enablePolling,
    Amount,
    Currency,
    billingAddress,
}: UseBitcoinParams): BitcoinHook => {
    const countryCode = billingAddress?.CountryCode ?? null;
    const state = billingAddress?.State ?? null;
    const zipCode = billingAddress?.ZipCode ?? null;

    const silentApi = getSilentApi(api);

    const [error, setError] = useState(false);
    const INITIAL_STATE: BitcoinTokenModel = {
        amountBitcoin: 0,
        address: '',
        token: null,
        amount: 0,
        currency: null,
        countryCode: null,
        state: null,
        zipCode: null,
    };
    const [model, setModel] = useState(INITIAL_STATE);
    const [loading, withLoading] = useLoading();
    const [processingBitcoinToken, withProcessingBitcoinToken] = useLoading();

    const [awaitingBitcoinPayment, setAwaitingBitcoinPayment] = useState(false);

    const checkStatus = useCheckStatus({
        api: silentApi,
        token: model.token,
        onTokenValidated: (token) => {
            const params: ChargeablePaymentParameters = {
                Amount,
                Currency,
                type: PAYMENT_METHOD_TYPES.CHARGEBEE_BITCOIN,
                chargeable: true,
                v: 5,
                PaymentToken: token,
            };

            return withProcessingBitcoinToken(onTokenValidated(params));
        },
        onTokenInvalid: () => {
            setError(true);
            setModel(INITIAL_STATE);
            setAwaitingBitcoinPayment(false);
        },
        enablePolling,
    });

    const bitcoinLoading = enablePolling && !checkStatus.bitcoinPaymentValidated && checkStatus.awaitingPayment;

    useEffect(() => {
        const awaitingPayment = checkStatus.awaitingPayment && !loading;
        setAwaitingBitcoinPayment(awaitingPayment);
    }, [checkStatus.awaitingPayment, loading]);

    const fetchAsToken = async () => {
        try {
            const data: CreateBitcoinTokenData = {
                Amount,
                Currency,
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
                amount: Amount,
                currency: Currency,
                countryCode,
                state,
                zipCode,
            });
        } catch (error) {
            setModel(INITIAL_STATE);
            throw error;
        }
    };

    const request = async () => {
        const isCorrectAmount = Amount >= getMinBitcoinAmount(Currency) && Amount <= getMaxBitcoinAmount(Currency);

        const alreadyHasToken =
            model.amount === Amount &&
            model.currency === Currency &&
            model.countryCode === countryCode &&
            model.state === state &&
            model.zipCode === zipCode &&
            !!model.token;

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

    const holders = {
        fetchPaymentToken: async () => {},
        verifyPaymentToken: async () => {},
        processPaymentToken: async () => {},
        fetchingToken: false,
        verifyingToken: false,
        processingToken: processingBitcoinToken,
        // since useBitcoin is old payment processor, I'm going to remove it soon. Implementing reset is useless.
        reset: () => {},
    };

    return {
        model,
        loading,
        request,
        error,
        amount: Amount,
        currency: Currency,
        awaitingBitcoinPayment,
        bitcoinLoading,
        processingBitcoinToken,
        ...checkStatus,
        meta: {
            type: 'chargebee-bitcoin',
        },
        ...holders,
        billingAddress,
        // Not implementable for Bitcoin at all. The loading state can't be detected by our code, nor Chargebee's, since
        // user does the transcation manually on blockchain outside of any PSP.
        userInitiatedProcessing: false,
    };
};

export default useBitcoin;
