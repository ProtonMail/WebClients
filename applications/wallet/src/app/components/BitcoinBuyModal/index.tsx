import { useState } from 'react';

import first from 'lodash/first';
import { c } from 'ttag';

import type { WasmApiCountry, WasmApiWallet, WasmApiWalletAccount } from '@proton/andromeda';
import { Loader, type ModalOwnProps } from '@proton/components';
import type { IWasmApiWalletData } from '@proton/wallet';
import { toWalletAccountSelectorOptions } from '@proton/wallet';

import { FullscreenModal } from '../../atoms/FullscreenModal';
import { useBitcoinBlockchainContext } from '../../contexts';
import { useGatewaysPublicApiKeys } from '../../store/hooks/useGatewaysPublicApiKeys';
import { isWalletAccountSet } from '../../utils';
import type { Steps } from '../ModalHeaderWithStepper';
import { ModalHeaderWithStepper } from '../ModalHeaderWithStepper';
import { WalletAccountSelector } from '../WalletAccountSelector';
import type { QuoteWithProvider } from './Amount';
import { Amount } from './Amount';
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
    { key: StepKey.Onramp, label: c('bitcoin buy').t`Buy` },
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

    const { bitcoinAddressHelperByWalletAccountId, decryptedApiWalletsData } = useBitcoinBlockchainContext();

    if (!apikeys || !isWalletAccountSet(selectedWalletAccount)) {
        return null;
    }

    const bitcoinAddressHelper = selectedWalletAccount[1]?.ID
        ? bitcoinAddressHelperByWalletAccountId[selectedWalletAccount[1].ID]
        : undefined;

    if (!bitcoinAddressHelper?.receiveBitcoinAddress) {
        return <Loader />;
    }

    return (
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
            <div className="flex flex-column items-center mb-8 wallet-fullscreen-modal-left">
                <div className="sticky top-0 w-full">
                    <WalletAccountSelector
                        disabled={stepKey === StepKey.Onramp}
                        value={selectedWalletAccount}
                        onSelect={(selected) => {
                            setSelectedWalletAccount(selected);
                        }}
                        options={toWalletAccountSelectorOptions(decryptedApiWalletsData ?? [])}
                    />
                </div>
            </div>

            <div>
                <div className="wallet-fullscreen-modal-main">
                    {stepKey === StepKey.Location && (
                        <Location
                            onConfirm={(country) => {
                                setCountry(country);
                                setStepKey(StepKey.Amount);
                            }}
                        />
                    )}

                    {stepKey === StepKey.Amount &&
                        (() => {
                            if (!country) {
                                return (
                                    <div className="color-danger text-center">{c('Wallet buy')
                                        .t`Missing country. Please refresh and try again or contact support`}</div>
                                );
                            }

                            return (
                                <Amount
                                    country={country}
                                    preselectedQuote={quote}
                                    onConfirm={(quote) => {
                                        setQuote(quote);
                                        setStepKey(StepKey.Onramp);
                                    }}
                                />
                            );
                        })()}

                    {stepKey === StepKey.Onramp &&
                        (() => {
                            if (!quote) {
                                return (
                                    <div className="color-danger text-center">{c('Wallet buy')
                                        .t`Missing quote. Please refresh and try again or contact support`}</div>
                                );
                            }

                            if (!bitcoinAddressHelper.receiveBitcoinAddress) {
                                return (
                                    <div className="color-danger text-center">{c('Wallet buy')
                                        .t`Missing bitcoin address. Please refresh and try again or contact support`}</div>
                                );
                            }

                            return (
                                <Checkout
                                    quote={quote}
                                    btcAddress={bitcoinAddressHelper.receiveBitcoinAddress.address}
                                    onDone={() => {
                                        onDone?.();
                                    }}
                                    onBack={() => {
                                        setStepKey(StepKey.Amount);
                                    }}
                                />
                            );
                        })()}
                </div>
            </div>

            {/* empty div for grid centering */}
            <div className="wallet-fullscreen-modal-right" />
        </FullscreenModal>
    );
};
