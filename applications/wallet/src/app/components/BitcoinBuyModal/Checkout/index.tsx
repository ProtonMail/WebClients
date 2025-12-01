import { useEffect, useState } from 'react';

import { RampInstantEventTypes } from '@ramp-network/ramp-instant-sdk';
import { c } from 'ttag';

import type { WasmGatewayProvider, WasmPaymentMethod } from '@proton/andromeda';
import { Button } from '@proton/atoms/Button/Button';
import { CircleLoader } from '@proton/atoms/CircleLoader/CircleLoader';
import { Tooltip } from '@proton/atoms/Tooltip/Tooltip';
import { Icon } from '@proton/components';
import { getApiSubdomainUrl } from '@proton/shared/lib/helpers/url';

import { VOLT_WEBSITE } from '../../../constants/buy';
import type { QuoteWithProvider } from '../AmountStep';

import './Checkout.scss';

enum StripeWidgetEventTypes {
    CHECKOUT_COMPLETED = 'CheckoutCompleted',
    CHECKOUT_CANCELLED = 'CheckoutCancelled',
}

interface Props {
    quote: QuoteWithProvider;
    btcAddress: string;
    checkoutUrl: string | null;
    onBack: () => void;
    onPurchaseComplete: () => void;
    onPurchaseCancelled: () => void;
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

export const Checkout = ({
    quote,
    btcAddress,
    checkoutUrl,
    onBack,
    onPurchaseComplete,
    onPurchaseCancelled,
}: Props) => {
    const [isLoading, setIsLoading] = useState(true);

    const handleEvent = (event?: MessageEvent<any>) => {
        if ([RampInstantEventTypes.WIDGET_CLOSE, 'onCloseOverlay'].includes(event?.data.type)) {
            onBack();
        }

        if (event?.data.type === StripeWidgetEventTypes.CHECKOUT_COMPLETED) {
            onPurchaseComplete();
        }

        if (event?.data.type === StripeWidgetEventTypes.CHECKOUT_CANCELLED) {
            onPurchaseCancelled();
        }
    };

    useEffect(() => {
        if (!checkoutUrl?.includes(VOLT_WEBSITE)) {
            return;
        }

        const popup = window.open(checkoutUrl, '_blank');
        const timer = setInterval(() => {
            if (!popup || popup.closed) {
                clearInterval(timer);
                window.removeEventListener('message', handleEvent);
                onBack();
            }
        }, 500);

        return () => {
            clearInterval(timer);
            window.removeEventListener('message', handleEvent);
            popup?.close();
        };
    }, [checkoutUrl, onBack]);

    useEffect(() => {
        window.addEventListener('message', handleEvent);

        return () => {
            window.removeEventListener('message', handleEvent);
        };
    }, [onBack, onPurchaseComplete, onPurchaseCancelled]);

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

                {checkoutUrl?.includes(VOLT_WEBSITE) ? (
                    <p>
                        {c('Info')
                            .t`Your checkout has opened in a new tab. Please complete your payment there and return to this page when finished.`}
                    </p>
                ) : (
                    <iframe
                        className="onramp-iframe"
                        allow="camera *; microphone *"
                        src={
                            checkoutUrl ??
                            buildUrl(
                                Number(quote.FiatAmount),
                                btcAddress,
                                quote.FiatCurrencySymbol,
                                quote.PaymentMethod,
                                quote.provider
                            )
                        }
                        title={c('Bitcoin buy').t`${quote.provider} checkout`}
                        onLoad={() => {
                            setIsLoading(false);
                        }}
                    />
                )}
            </div>
        </div>
    );
};
