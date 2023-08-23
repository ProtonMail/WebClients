import { ReactNode, useEffect, useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { PAYMENT_METHOD_TYPES, PAYMENT_TOKEN_STATUS, TokenPaymentMethod } from '@proton/components/payments/core';
import { getSilentApi } from '@proton/shared/lib/api/helpers/customConfig';
import { getTokenStatus } from '@proton/shared/lib/api/payments';
import { MAX_BITCOIN_AMOUNT, MIN_BITCOIN_AMOUNT } from '@proton/shared/lib/constants';
import { wait } from '@proton/shared/lib/helpers/promise';
import { Api, Currency } from '@proton/shared/lib/interfaces';

import { Alert, Bordered, Loader, Price } from '../../components';
import BitcoinDetails from './BitcoinDetails';
import BitcoinQRCode, { OwnProps as BitcoinQRCodeProps } from './BitcoinQRCode';
import { BitcoinTokenModel } from './useBitcoin';

function pause() {
    return wait(10000);
}

const useCheckStatus = (
    api: Api,
    token: string | null,
    onTokenValidated: (token: string) => void,
    enabled: boolean = true
) => {
    const [paymentValidated, setPaymentValidated] = useState(false);
    const awaitingPayment = token !== null && !paymentValidated;

    useEffect(() => {
        let active = enabled;

        const validate = async (token: string): Promise<boolean> => {
            try {
                const { Status } = await api<any>(getTokenStatus(token));
                if (Status === PAYMENT_TOKEN_STATUS.STATUS_CHARGEABLE) {
                    return true;
                }
            } catch {}

            return false;
        };

        async function run() {
            if (!token) {
                return;
            }

            await pause();
            while (active) {
                const resolved = await validate(token);
                if (resolved && active) {
                    setPaymentValidated(true);
                    onTokenValidated?.(token);
                    active = false;
                    break;
                }
                await pause();
            }
        }

        void run();

        return () => {
            active = false;
        };
    }, [token]);

    return {
        paymentValidated,
        awaitingPayment,
    };
};

export interface ValidatedBitcoinToken extends TokenPaymentMethod {
    cryptoAmount: number;
    cryptoAddress: string;
}

export interface Props {
    api: Api;
    amount: number;
    currency: Currency;
    onTokenValidated?: (data: ValidatedBitcoinToken) => void;
    onAwaitingPayment?: (awaitingPayment: boolean) => void;
    processingToken?: boolean;
    model: BitcoinTokenModel;
    loading: boolean;
    error: boolean;
    request: () => Promise<void>;
}

const Bitcoin = ({
    api,
    amount,
    currency,
    onTokenValidated,
    onAwaitingPayment,
    processingToken,
    model,
    loading,
    error,
    request,
}: Props) => {
    const silentApi = getSilentApi(api);

    const { paymentValidated, awaitingPayment } = useCheckStatus(silentApi, model.token, (token) =>
        onTokenValidated?.({
            Payment: {
                Type: PAYMENT_METHOD_TYPES.TOKEN,
                Details: {
                    Token: token,
                },
            },
            cryptoAmount: model.amountBitcoin,
            cryptoAddress: model.address,
        })
    );

    useEffect(() => {
        onAwaitingPayment?.(awaitingPayment && !loading);
    }, [awaitingPayment, loading]);

    useEffect(() => {
        void request();
    }, [amount, currency]);

    if (amount < MIN_BITCOIN_AMOUNT) {
        const i18n = (amount: ReactNode) => c('Info').jt`Amount below minimum (${amount}).`;
        return (
            <Alert className="mb-4" type="warning">
                {i18n(
                    <Price key="price" currency={currency}>
                        {MIN_BITCOIN_AMOUNT}
                    </Price>
                )}
            </Alert>
        );
    }
    if (amount > MAX_BITCOIN_AMOUNT) {
        const i18n = (amount: ReactNode) => c('Info').jt`Amount above maximum (${amount}).`;
        return (
            <Alert className="mb-4" type="warning">
                {i18n(
                    <Price key="price" currency={currency}>
                        {MAX_BITCOIN_AMOUNT}
                    </Price>
                )}
            </Alert>
        );
    }

    if (loading) {
        return <Loader />;
    }

    if (error || !model.amountBitcoin || !model.address) {
        return (
            <>
                <Alert className="mb-4" type="error">{c('Error').t`Error connecting to the Bitcoin API.`}</Alert>
                <Button onClick={request} data-testid="bitcoin-try-again">{c('Action').t`Try again`}</Button>
            </>
        );
    }

    const qrCodeStatus: BitcoinQRCodeProps['status'] = (() => {
        if (processingToken) {
            return 'pending';
        }
        if (paymentValidated) {
            return 'confirmed';
        }
        return 'initial';
    })();

    const btcAmountBold = (
        <span className="text-bold" key="btc-info-amount">
            {model.amountBitcoin} BTC
        </span>
    );

    return (
        <Bordered className="p-6 rounded" data-testid="bitcoin-payment-data">
            <div>
                <span>
                    {c('Info').jt`To complete your payment, please send ${btcAmountBold} to the address below.`}
                </span>
                <div className="my-6 flex flex-justify-center">
                    <BitcoinQRCode
                        className="flex flex-align-items-center flex-column"
                        amount={model.amountBitcoin}
                        address={model.address}
                        status={qrCodeStatus}
                    />
                </div>
            </div>
            <BitcoinDetails amount={model.amountBitcoin} address={model.address} />
        </Bordered>
    );
};

export default Bitcoin;
