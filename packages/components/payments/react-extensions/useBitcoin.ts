import { useEffect, useState } from 'react';

import { useLoading } from '@proton/hooks';
import {
    type AmountAndCurrency,
    type BillingAddress,
    type ChargeablePaymentParameters,
    PAYMENT_METHOD_TYPES,
    PAYMENT_TOKEN_STATUS,
    type TokenPaymentMethod,
    isTokenPaymentMethod,
} from '@proton/payments';
import { getSilentApi } from '@proton/shared/lib/api/helpers/customConfig';
import {
    type CreateBitcoinTokenData,
    type PaymentsVersion,
    createToken,
    getTokenStatus,
} from '@proton/shared/lib/api/payments';
import { MAX_BITCOIN_AMOUNT, MIN_BITCOIN_AMOUNT } from '@proton/shared/lib/constants';
import { wait } from '@proton/shared/lib/helpers/promise';
import { type Api } from '@proton/shared/lib/interfaces';

import { type PaymentProcessorHook } from './interface';

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
    paymentsVersion,
}: {
    api: Api;
    token: string | null;
    onTokenValidated: (token: string) => void;
    onTokenInvalid: () => void;
    enablePolling: boolean;
    paymentsVersion: PaymentsVersion;
}) => {
    const [paymentValidated, setPaymentValidated] = useState(false);
    const awaitingPayment = token !== null && !paymentValidated;

    useEffect(() => {
        let active = true;

        const validate = async (token: string): Promise<TokenValidationStatus> => {
            try {
                const { Status } = await api<any>(getTokenStatus(token, paymentsVersion));
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
        bitcoinPaymentValidated: paymentValidated,
        awaitingPayment,
    };
};

export interface BitcoinTokenModel {
    amountBitcoin: number;
    address: string;
    token: string | null;
    amount: number;
    currency: string | null;
    countryCode: string | null;
    state: string | null;
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

export type OnBitcoinTokenValidated = (data: ChargeablePaymentParameters) => Promise<any>;

export type UseBitcoinParams = {
    api: Api;
    onTokenValidated: OnBitcoinTokenValidated;
    enablePolling: boolean;
    paymentsVersion: PaymentsVersion;
    billingAddress?: BillingAddress;
} & AmountAndCurrency;

export interface BitcoinHook extends PaymentProcessorHook {
    model: BitcoinTokenModel;
    loading: boolean;
    request: () => Promise<void>;
    error: boolean;
    amount: number;
    currency: string;
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
    paymentsVersion,
    billingAddress,
}: UseBitcoinParams): BitcoinHook => {
    const countryCode = billingAddress?.CountryCode ?? null;
    const state = billingAddress?.State ?? null;

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
    };
    const [model, setModel] = useState(INITIAL_STATE);
    const [loading, withLoading] = useLoading();
    const [processingBitcoinToken, withProcessingBitcoinToken] = useLoading();

    const [awaitingBitcoinPayment, setAwaitingBitcoinPayment] = useState(false);

    const checkStatus = useCheckStatus({
        paymentsVersion,
        api: silentApi,
        token: model.token,
        onTokenValidated: (token) => {
            const params: ChargeablePaymentParameters = {
                Amount,
                Currency,
                type: paymentsVersion === 'v4' ? PAYMENT_METHOD_TYPES.BITCOIN : PAYMENT_METHOD_TYPES.CHARGEBEE_BITCOIN,
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

            const { Token, Data } = await silentApi<any>(createToken(data, paymentsVersion));

            setModel({
                amountBitcoin: Data.CoinAmount,
                address: Data.CoinAddress,
                token: Token,
                amount: Amount,
                currency: Currency,
                countryCode,
                state,
            });
        } catch (error) {
            setModel(INITIAL_STATE);
            throw error;
        }
    };

    const request = async () => {
        const isCorrectAmount = Amount >= MIN_BITCOIN_AMOUNT && Amount <= MAX_BITCOIN_AMOUNT;

        const alreadyHasToken =
            model.amount === Amount &&
            model.currency === Currency &&
            model.countryCode === countryCode &&
            model.state === state &&
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
            type: paymentsVersion === 'v4' ? 'bitcoin' : 'chargebee-bitcoin',
        },
        ...holders,
        billingAddress,
    };
};

export default useBitcoin;
