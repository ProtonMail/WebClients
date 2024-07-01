import { useState } from 'react';

import { MoonPayProvider } from '@moonpay/moonpay-react';
import { first } from 'lodash';
import { c } from 'ttag';

import { WasmApiCountry, WasmApiWallet, WasmApiWalletAccount } from '@proton/andromeda';
import { ModalOwnProps } from '@proton/components/components';
import { IWasmApiWalletData } from '@proton/wallet';

import { FullscreenModal } from '../../atoms/FullscreenModal';
import { useBitcoinBlockchainContext } from '../../contexts';
import { useGatewaysPublicApiKeys } from '../../store/hooks/useGatewaysPublicApiKeys';
import { getAccountWithChainDataFromManyWallets, isWalletAccountSet } from '../../utils';
import { useAsyncValue } from '../../utils/hooks/useAsyncValue';
import { useComputeNextAddressToReceive } from '../../utils/hooks/useComputeNextIndexToReceive';
import { toWalletAccountSelectorOptions } from '../../utils/wallet';
import { ModalHeaderWithStepper, Steps } from '../ModalHeaderWithStepper';
import { WalletAccountSelector } from '../WalletAccountSelector';
import { Amount, QuoteWithProvider } from './Amount';
import { Checkout } from './Checkout';
import { Location } from './Location';

interface Props {
    wallet: IWasmApiWalletData;
    account?: WasmApiWalletAccount;
    modal: ModalOwnProps;
    onDone?: () => void;
}

enum StepKey {
    Location = 'Location',
    Amount = 'Amount',
    Onramp = 'Onramp',
}

const getSteps = (): Steps<StepKey> => [
    { key: StepKey.Location, label: c('bitcoin buy').t`Location` },
    { key: StepKey.Amount, label: c('bitcoin buy').t`Amount` },
    { key: StepKey.Onramp, label: c('bitcoin buy').t`Onramp` },
];

export const BitcoinBuyModal = ({ wallet, account, modal, onDone }: Props) => {
    const [stepKey, setStepKey] = useState<StepKey>(StepKey.Location);
    const [country, setCountry] = useState<WasmApiCountry>();
    const [quote, setQuote] = useState<QuoteWithProvider>();

    const [apikeys] = useGatewaysPublicApiKeys();

    const defaultWalletAccount = first(wallet.WalletAccounts);
    const [selectedWalletAccount, setSelectedWalletAccount] = useState<[WasmApiWallet, WasmApiWalletAccount?]>([
        wallet.Wallet,
        account ?? defaultWalletAccount,
    ]);

    const { walletsChainData, decryptedApiWalletsData } = useBitcoinBlockchainContext();
    const wasmAccount = getAccountWithChainDataFromManyWallets(
        walletsChainData,
        account?.WalletID,
        selectedWalletAccount[1]?.ID
    );

    const computeNextIndexToReceive = useComputeNextAddressToReceive(walletsChainData);

    const btcAddress = useAsyncValue(
        (async () => {
            if (isWalletAccountSet(selectedWalletAccount)) {
                const index = await computeNextIndexToReceive(selectedWalletAccount[1]);
                const address = await wasmAccount?.account.getAddress(index);

                return address?.address;
            } else {
                return null;
            }
        })(),
        null
    );

    if (!apikeys || !isWalletAccountSet(selectedWalletAccount)) {
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
                <div className="flex flex-row justify-space-between">
                    <div className="mb-8 mr-4">
                        <WalletAccountSelector
                            disabled={stepKey === StepKey.Onramp}
                            value={selectedWalletAccount}
                            onSelect={(selected) => {
                                setSelectedWalletAccount(selected);
                            }}
                            options={toWalletAccountSelectorOptions(decryptedApiWalletsData ?? [])}
                        />
                    </div>

                    <div className="w-full mx-auto" style={{ maxWidth: '31rem' }}>
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
                                    setStepKey(StepKey.Onramp);
                                }}
                            />
                        )}

                        {stepKey === StepKey.Onramp && quote && btcAddress && (
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
                    </div>

                    {/* Dumb div to equilibrate flexbox */}
                    <div />
                </div>
            </FullscreenModal>
        </MoonPayProvider>
    );
};
