import { useEffect, useMemo, useState } from 'react';

import { MoonPayBuyWidget } from '@moonpay/moonpay-react';
import { RampInstantEventTypes, RampInstantSDK } from '@ramp-network/ramp-instant-sdk';
import { c } from 'ttag';

import { Button } from '@proton/atoms/Button';
import { CircleLoader } from '@proton/atoms/CircleLoader';
import { Icon, Tooltip } from '@proton/components/components';
import { WALLET_APP_NAME } from '@proton/shared/lib/constants';
import { DEFAULT_DISPLAY_BITCOIN_UNIT, useWalletApi } from '@proton/wallet';

import { useGatewaysPublicApiKeys } from '../../../store/hooks/useGatewaysPublicApiKeys';
import { bitcoinToSats } from '../../../utils';
import { QuoteWithProvider } from '../Amount';

import './Checkout.scss';

interface Props {
    quote: QuoteWithProvider;
    btcAddress: string;
    onBack: () => void;
    onDone: () => void;
}

const RAMP_SWAP_ASSET = 'BTC_BTC';

export const Checkout = ({ quote, btcAddress, onBack, onDone }: Props) => {
    const walletApi = useWalletApi();
    const [banxaCheckoutUrl, setBanxaCheckoutUrl] = useState<string | null>(null);
    const [apikeys] = useGatewaysPublicApiKeys();

    useEffect(() => {
        const run = async () => {
            if (quote.provider === 'Banxa') {
                const checkoutUrl = await walletApi
                    .clients()
                    .payment_gateway.createOnRampCheckout(
                        quote.FiatAmount,
                        btcAddress,
                        quote.FiatCurrencySymbol,
                        quote.PaymentMethod,
                        quote.provider
                    )
                    .catch(() => null);

                setBanxaCheckoutUrl(checkoutUrl);
            }
        };

        void run();
    }, [btcAddress, quote, quote.FiatAmount, quote.FiatCurrencySymbol, quote.PaymentMethod, quote.provider, walletApi]);

    const [rampInstanceSdk, checkoutContent] = useMemo(() => {
        if (quote.provider === 'MoonPay') {
            return [
                null,
                () => (
                    <MoonPayBuyWidget
                        // data
                        baseCurrencyCode={quote.FiatCurrencySymbol.toLowerCase()}
                        baseCurrencyAmount={quote.FiatAmount}
                        walletAddress={btcAddress}
                        defaultCurrencyCode={DEFAULT_DISPLAY_BITCOIN_UNIT.toLowerCase()}
                        // style
                        variant="overlay"
                        // flow handler
                        onUrlSignatureRequested={async (url) => {
                            const signature = await walletApi
                                .clients()
                                .payment_gateway.signUrl(url, quote.provider)
                                .catch(() => '');

                            return signature;
                        }}
                        onCloseOverlay={() => {
                            onBack();
                        }}
                        onTransactionCreated={async () => {
                            onDone();
                        }}
                        visible
                    />
                ),
            ];
        }

        if (quote.provider === 'Banxa') {
            return [
                null,
                () => (
                    <div className="banxa-iframe-container">
                        <>
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
                            {banxaCheckoutUrl ? (
                                <iframe
                                    className="banxa-iframe"
                                    src={banxaCheckoutUrl}
                                    title={c('Bitcoin buy').t`Banxa checkout`}
                                />
                            ) : (
                                <CircleLoader className="color-primary" />
                            )}
                        </>
                    </div>
                ),
            ];
        }

        if (quote.provider === 'Ramp' && apikeys) {
            const rampInstanceSdk = () =>
                new RampInstantSDK({
                    hostApiKey: apikeys.ramp,

                    fiatValue: quote.FiatAmount,
                    fiatCurrency: quote.FiatCurrencySymbol,
                    swapAsset: RAMP_SWAP_ASSET,
                    swapAmount: bitcoinToSats(Number(quote.BitcoinAmount)).toFixed(0),
                    userAddress: btcAddress,

                    hostAppName: WALLET_APP_NAME,
                    hostLogoUrl:
                        'https://res.cloudinary.com/dbulfrlrz/image/upload/v1703162849/static/logos/texts/proton-purple_lf83vr.svg',
                })
                    .on(RampInstantEventTypes.WIDGET_CLOSE, () => {
                        onBack();
                    })
                    .on(RampInstantEventTypes.PURCHASE_CREATED, () => {
                        onDone();
                    });

            return [rampInstanceSdk, null];
        }

        return [null, null];
    }, [
        quote.provider,
        quote.FiatCurrencySymbol,
        quote.FiatAmount,
        quote.BitcoinAmount,
        apikeys,
        walletApi,
        onBack,
        onDone,
        banxaCheckoutUrl,
        btcAddress,
    ]);

    useEffect(() => {
        if (document.getElementById('ramp-container') && rampInstanceSdk) {
            rampInstanceSdk().show();
        }
    }, [rampInstanceSdk]);

    return (
        <div className="flex flex-column max-w-full justify-center items-center">
            <div id={`${quote.provider.toLowerCase()}-container`} className="w-full h-full">
                {checkoutContent?.()}
            </div>
        </div>
    );
};
