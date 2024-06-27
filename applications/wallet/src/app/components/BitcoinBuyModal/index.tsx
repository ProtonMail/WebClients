import { useState } from 'react';

import { MoonPayProvider } from '@moonpay/moonpay-react';
import { c } from 'ttag';

import { WasmApiCountry, WasmApiWalletAccount } from '@proton/andromeda';
import { ModalOwnProps } from '@proton/components/components';

import { FullscreenModal } from '../../atoms/FullscreenModal';
import { useBitcoinBlockchainContext } from '../../contexts';
import { useGatewaysPublicApiKeys } from '../../store/hooks/useGatewaysPublicApiKeys';
import { getAccountWithChainDataFromManyWallets } from '../../utils';
import { useAsyncValue } from '../../utils/hooks/useAsyncValue';
import { useComputeNextAddressToReceive } from '../../utils/hooks/useComputeNextIndexToReceive';
import { ModalHeaderWithStepper, Steps } from '../ModalHeaderWithStepper';
import { Amount, QuoteWithProvider } from './Amount';
import { Checkout } from './Checkout';
import { Location } from './Location';

interface Props {
    account: WasmApiWalletAccount;
    modal: ModalOwnProps;
    onDone?: () => void;
}

enum StepKey {
    Location = 'Location',
    Amount = 'Amount',
    Payment = 'Payment',
}

const getSteps = (): Steps<StepKey> => [
    { key: StepKey.Location, label: c('bitcoin buy').t`Location` },
    { key: StepKey.Amount, label: c('bitcoin buy').t`Amount` },
    { key: StepKey.Payment, label: c('bitcoin buy').t`Onramp` },
];

export const BitcoinBuyModal = ({ account, modal, onDone }: Props) => {
    const [stepKey, setStepKey] = useState<StepKey>(StepKey.Location);
    const [country, setCountry] = useState<WasmApiCountry>();
    const [quote, setQuote] = useState<QuoteWithProvider>();

    const [apikeys] = useGatewaysPublicApiKeys();

    const { walletsChainData } = useBitcoinBlockchainContext();
    const wasmAccount = getAccountWithChainDataFromManyWallets(walletsChainData, account?.WalletID, account?.ID);

    const computeNextIndexToReceive = useComputeNextAddressToReceive(walletsChainData);

    const btcAddress = useAsyncValue(
        (async () => {
            const index = await computeNextIndexToReceive(account);
            const address = await wasmAccount?.account.getAddress(index);

            return address?.address;
        })(),
        null
    );

    if (!apikeys) {
        return null;
    }

    return (
        <MoonPayProvider apiKey={apikeys.moonpay}>
            <FullscreenModal
                header={
                    <ModalHeaderWithStepper
                        onClose={() => {
                            modal.onClose?.();
                            onDone?.();
                        }}
                        onClickStep={(key) => {
                            setStepKey(key);
                        }}
                        currentStep={stepKey}
                        steps={getSteps()}
                    />
                }
                {...modal}
            >
                {stepKey === StepKey.Location && (
                    <Location
                        onConfirm={(country) => {
                            setCountry(country);
                            setStepKey(StepKey.Amount);
                        }}
                    />
                )}

                {stepKey === StepKey.Amount && country && (
                    <Amount
                        country={country}
                        preselectedQuote={quote}
                        onConfirm={(quote) => {
                            setQuote(quote);
                            setStepKey(StepKey.Payment);
                        }}
                    />
                )}

                {stepKey === StepKey.Payment && quote && btcAddress && (
                    <Checkout
                        quote={quote}
                        btcAddress={btcAddress}
                        onDone={() => {
                            onDone?.();
                        }}
                        onBack={() => {
                            setStepKey(StepKey.Amount);
                        }}
                    />
                )}
            </FullscreenModal>
        </MoonPayProvider>
    );
};
