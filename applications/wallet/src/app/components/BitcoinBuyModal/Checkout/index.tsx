import { useEffect, useState } from 'react';

import { RampInstantEventTypes } from '@ramp-network/ramp-instant-sdk';
import { c } from 'ttag';

import type { WasmGatewayProvider, WasmPaymentMethod } from '@proton/andromeda';
import { Button } from '@proton/atoms';
import { CircleLoader } from '@proton/atoms/CircleLoader';
import { Icon, Tooltip } from '@proton/components';
import { getApiSubdomainUrl } from '@proton/shared/lib/helpers/url';

import type { QuoteWithProvider } from '../Amount';

import './Checkout.scss';

interface Props {
    quote: QuoteWithProvider;
    btcAddress: string;
    onBack: () => void;
    onDone: () => void;
}

const buildUrl = (
    amount: number,
    bitcoinAddress: string,
    currency: string,
    paymentMethod: WasmPaymentMethod,
    provider: WasmGatewayProvider
) => {
    const wasmPaymentMethodToNumber: Record<WasmPaymentMethod, number> = {
        ApplePay: 1,
        BankTransfer: 2,
        Card: 3,
        GooglePay: 4,
        InstantPayment: 5,
        Paypal: 6,
        Unsupported: -1,
    };

    const url = getApiSubdomainUrl(`/wallet/v1/payment-gateway/on-ramp/iframe`, window.location.origin);

    url.searchParams.set('Amount', amount.toString());
    url.searchParams.set('BitcoinAddress', bitcoinAddress);
    url.searchParams.set('FiatCurrency', currency);
    url.searchParams.set('PaymentMethod', wasmPaymentMethodToNumber[paymentMethod].toString());
    url.searchParams.set('Provider', provider);

    return url.toString();
};

export const Checkout = ({ quote, btcAddress, onBack, onDone }: Props) => {
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const handleEvent = (event?: MessageEvent<any>) => {
            if ([RampInstantEventTypes.WIDGET_CLOSE, 'onCloseOverlay'].includes(event?.data.type)) {
                onBack();
            }
        };

        window.addEventListener('message', handleEvent);

        return () => {
            window.removeEventListener('message', handleEvent);
        };
    }, [onBack, onDone]);

    return (
        <div className="flex flex-column max-w-full justify-center items-center">
            <div className="onramp-iframe-container w-full h-full">
                <Tooltip title={c('Action').t`Close`}>
                    <Button
                        className="onramp-close-button shrink-0 rounded-full bg-norm"
                        icon
                        shape="solid"
                        data-testid="modal:close"
                        onClick={onBack}
                    >
                        <Icon className="modal-close-icon" name="cross-big" alt={c('Action').t`Close`} />
                    </Button>
                </Tooltip>

                {isLoading && <CircleLoader className="onramp-loader color-primary" />}

                <iframe
                    className="onramp-iframe"
                    allow="camera *;microphone *"
                    src={buildUrl(
                        Number(quote.FiatAmount),
                        btcAddress,
                        quote.FiatCurrencySymbol,
                        quote.PaymentMethod,
                        quote.provider
                    )}
                    title={c('Bitcoin buy').t`${quote.provider} checkout`}
                    onLoad={() => {
                        setIsLoading(false);
                    }}
                />
            </div>
        </div>
    );
};
