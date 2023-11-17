import { ReactNode, useEffect } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { MAX_BITCOIN_AMOUNT, MIN_BITCOIN_AMOUNT } from '@proton/shared/lib/constants';

import { Alert, Bordered, Loader, Price } from '../../components';
import BitcoinDetails from './BitcoinDetails';
import BitcoinQRCode, { OwnProps as BitcoinQRCodeProps } from './BitcoinQRCode';
import useBitcoin from './useBitcoin';

export type Props = ReturnType<typeof useBitcoin> & {
    processingToken?: boolean;
};

const Bitcoin = ({ amount, currency, processingToken, paymentValidated, model, loading, error, request }: Props) => {
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
                <div className="my-6 flex justify-center">
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
