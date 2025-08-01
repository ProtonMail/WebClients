import type { ReactNode } from 'react';
import { useEffect } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms';
import Alert from '@proton/components/components/alert/Alert';
import Bordered from '@proton/components/components/container/Bordered';
import Price from '@proton/components/components/price/Price';
import type { BitcoinHook } from '@proton/components/payments/react-extensions/useBitcoin';
import { MAX_BITCOIN_AMOUNT, MIN_BITCOIN_AMOUNT } from '@proton/payments';

import BitcoinDetails from './BitcoinDetails';
import type { OwnProps as BitcoinQRCodeProps } from './BitcoinQRCode';
import BitcoinQRCode from './BitcoinQRCode';

export type Props = BitcoinHook & {
    suffix?: ReactNode;
};

const Bitcoin = ({
    amount,
    currency,
    processingBitcoinToken,
    bitcoinPaymentValidated,
    model,
    loading,
    error,
    request,
    billingAddress,
    suffix,
}: Props) => {
    useEffect(() => {
        void request();
    }, [amount, currency, billingAddress?.CountryCode, billingAddress?.State, billingAddress?.ZipCode]);

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

    if (error) {
        return (
            <>
                <Alert className="mb-4" type="error">{c('Error').t`Error connecting to the Bitcoin API.`}</Alert>
                <Button onClick={request} data-testid="bitcoin-try-again">{c('Action').t`Try again`}</Button>
            </>
        );
    }

    const qrCodeStatus: BitcoinQRCodeProps['status'] = (() => {
        if (loading) {
            return 'hidden';
        }
        if (processingBitcoinToken) {
            return 'pending';
        }
        if (bitcoinPaymentValidated) {
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
                <div className="my-6 flex justify-center">
                    <BitcoinQRCode
                        className="flex items-center flex-column"
                        amount={model.amountBitcoin}
                        address={model.address}
                        status={qrCodeStatus}
                    />
                </div>
            </div>
            <BitcoinDetails loading={loading} amount={model.amountBitcoin} address={model.address} />
            {suffix}
        </Bordered>
    );
};

export default Bitcoin;
