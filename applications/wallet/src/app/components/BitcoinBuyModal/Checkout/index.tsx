import { useEffect } from 'react';

import { RampInstantEventTypes } from '@ramp-network/ramp-instant-sdk';
import { c } from 'ttag';

import { Button } from '@proton/atoms/Button';
import { Icon, Tooltip } from '@proton/components/components';
import { useWalletApi } from '@proton/wallet';

import { QuoteWithProvider } from '../Amount';

import './Checkout.scss';

interface Props {
    quote: QuoteWithProvider;
    btcAddress: string;
    onBack: () => void;
    onDone: () => void;
}

export const Checkout = ({ quote, btcAddress, onBack, onDone }: Props) => {
    const walletApi = useWalletApi();

    useEffect(() => {
        const handleEvent = (event?: MessageEvent<any>) => {
            if ([RampInstantEventTypes.WIDGET_CLOSE, 'onCloseOverlay'].includes(event?.data.type)) {
                onBack();
            }

            if ([RampInstantEventTypes.PURCHASE_CREATED, 'onTransactionCompleted'].includes(event?.data.type)) {
                onDone();
            }

            // eslint-disable-next-line no-console
            console.log('event', event);
        };

        window.addEventListener('message', handleEvent);

        return () => {
            window.removeEventListener('message', handleEvent);
        };
    }, [onBack, onDone]);

    return (
        <div className="flex flex-column max-w-full justify-center items-center">
            <div className="banxa-iframe-container w-full h-full">
                <Tooltip title={c('Action').t`Close`}>
                    <Button
                        className="banxa-close-button shrink-0 rounded-full bg-norm"
                        icon
                        shape="solid"
                        data-testid="modal:close"
                        onClick={onBack}
                    >
                        <Icon className="modal-close-icon" name="cross-big" alt={c('Action').t`Close`} />
                    </Button>
                </Tooltip>

                <iframe
                    className="banxa-iframe"
                    src={walletApi
                        .clients()
                        .payment_gateway.getCheckoutIframeSrc(
                            Number(quote.FiatAmount),
                            btcAddress,
                            quote.FiatCurrencySymbol,
                            quote.PaymentMethod,
                            quote.provider
                        )}
                    title={c('Bitcoin buy').t`${quote.provider} checkout`}
                />
            </div>
        </div>
    );
};
