import { ReactNode, useEffect, useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { PAYMENT_METHOD_TYPES, PAYMENT_TOKEN_STATUS, TokenPaymentMethod } from '@proton/components/payments/core';
import { useLoading } from '@proton/hooks';
import { getSilentApi } from '@proton/shared/lib/api/helpers/customConfig';
import {
    CreateBitcoinTokenData,
    createBitcoinPayment,
    createToken,
    getTokenStatus,
} from '@proton/shared/lib/api/payments';
import { MAX_BITCOIN_AMOUNT, MIN_BITCOIN_AMOUNT } from '@proton/shared/lib/constants';
import { wait } from '@proton/shared/lib/helpers/promise';
import { Api, Currency } from '@proton/shared/lib/interfaces';

import { Alert, Bordered, Loader, Price } from '../../components';
import { PaymentMethodFlows } from '../paymentMethods/interface';
import BitcoinDetails from './BitcoinDetails';
import BitcoinQRCode, { OwnProps as BitcoinQRCodeProps } from './BitcoinQRCode';

function pause() {
    return wait(10000);
}

const useCheckStatus = (
    api: Api,
    token: string | null,
    onTokenValidated: (token: string) => void,
    enabled: boolean
) => {
    const [paymentValidated, setPaymentValidated] = useState(false);

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

        run();

        return () => {
            active = false;
        };
    }, [token]);

    return {
        paymentValidated,
    };
};

export interface ValidatedBitcoinToken extends TokenPaymentMethod {
    cryptoAmount: number;
    cryptoAddress: string;
}

interface Props {
    api: Api;
    amount: number;
    currency: Currency;
    type: PaymentMethodFlows;
    onTokenValidated?: (data: ValidatedBitcoinToken) => void;
    awaitingPayment: boolean;
    enableValidation?: boolean;
}

const Bitcoin = ({
    api,
    amount,
    currency,
    type,
    onTokenValidated,
    awaitingPayment,
    enableValidation = false,
}: Props) => {
    const silentApi = getSilentApi(api);
    const [loading, withLoading] = useLoading();
    const [error, setError] = useState(false);
    const [model, setModel] = useState({ amountBitcoin: 0, address: '', token: null });

    const { paymentValidated } = useCheckStatus(
        silentApi,
        model.token,
        (token) =>
            onTokenValidated?.({
                Payment: {
                    Type: PAYMENT_METHOD_TYPES.TOKEN,
                    Details: {
                        Token: token,
                    },
                },
                cryptoAmount: model.amountBitcoin,
                cryptoAddress: model.address,
            }),
        enableValidation
    );

    const request = async () => {
        const fetchWithoutToken = async () => {
            const { AmountBitcoin, Address } = await api(createBitcoinPayment(amount, currency));
            setModel({ amountBitcoin: AmountBitcoin, address: Address, token: null });
        };

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
                setModel({ amountBitcoin: Data.CoinAmount, address: Data.CoinAddress, token: Token });
            } catch (error) {
                await fetchWithoutToken();
            }
        };

        setError(false);
        try {
            if (type === 'signup-pass') {
                await fetchAsToken();
            } else {
                await fetchWithoutToken();
            }
        } catch (error) {
            setError(true);
            throw error;
        }
    };

    useEffect(() => {
        if (amount >= MIN_BITCOIN_AMOUNT && amount <= MAX_BITCOIN_AMOUNT) {
            withLoading(request());
        }
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
                <Button onClick={() => withLoading(request())}>{c('Action').t`Try again`}</Button>
            </>
        );
    }

    const qrCodeStatus: BitcoinQRCodeProps['status'] = awaitingPayment
        ? 'pending'
        : paymentValidated
        ? 'confirmed'
        : 'initial';

    const btcAmountBold = <span className="text-bold">{model.amountBitcoin} BTC</span>;

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
            <div className="pt-4 px-4">
                {type === 'invoice' && (
                    <div className="mb-4">{c('Info')
                        .t`Bitcoin transactions can take some time to be confirmed (up to 24 hours). Once confirmed, we will add credits to your account. After transaction confirmation, you can pay your invoice with the credits.`}</div>
                )}
            </div>
        </Bordered>
    );
};

export default Bitcoin;
