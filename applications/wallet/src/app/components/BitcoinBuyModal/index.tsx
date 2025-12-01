import { useState } from 'react';

import first from 'lodash/first';
import { c } from 'ttag';

import type { WasmApiCountry, WasmApiWallet, WasmApiWalletAccount } from '@proton/andromeda';
import { Loader, type ModalOwnProps } from '@proton/components';
import type { ApiWalletWithPassphraseInput, IWasmApiWalletData } from '@proton/wallet';
import { toWalletAccountSelectorOptions } from '@proton/wallet';
import { resetQuotesByProvider, useWalletDispatch } from '@proton/wallet/store';

import { FullscreenModal } from '../../atoms/FullscreenModal';
import { AZTECO } from '../../constants/buy';
import { useBitcoinBlockchainContext } from '../../contexts';
import { isWalletAccountSet } from '../../utils';
import type { Steps } from '../ModalHeaderWithStepper';
import { ModalHeaderWithStepper } from '../ModalHeaderWithStepper';
import { WalletAccountSelector } from '../WalletAccountSelector';
import type { QuoteWithProvider } from './AmountStep';
import { AmountStep } from './AmountStep';
import { BitcoinBuyAztecoConfirmModal } from './BitcoinBuyAztecoConfirmModal';
import { BitcoinBuyConfirmModal } from './BitcoinBuyConfirmModal';
import { BitcoinBuyInProgressModal } from './BitcoinBuyInProgressModal';
import { Checkout } from './Checkout';
import { Location } from './Location';

interface Props {
    wallet: IWasmApiWalletData;
    account?: WasmApiWalletAccount;
    modal: ModalOwnProps;
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

export const BitcoinBuyModal = ({ wallet, account, modal }: Props) => {
    const dispatch = useWalletDispatch();
    const [stepKey, setStepKey] = useState<StepKey>(StepKey.Location);
    const [country, setCountry] = useState<WasmApiCountry>();
    const [quote, setQuote] = useState<QuoteWithProvider>();
    const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null);

    const [openedModal, setOpenedModal] = useState<'buy' | 'confirm' | 'confirm-azteco' | 'in-progress'>('buy');

    const defaultWalletAccount = first(wallet.WalletAccounts);
    const defaultSelected: [ApiWalletWithPassphraseInput, WasmApiWalletAccount | undefined] = [
        wallet.Wallet,
        account ?? defaultWalletAccount,
    ];

    const [selectedWalletAccount, setSelectedWalletAccount] =
        useState<[WasmApiWallet, WasmApiWalletAccount?]>(defaultSelected);

    const { bitcoinAddressHelperByWalletAccountId, apiWalletsData } = useBitcoinBlockchainContext();

    if (!isWalletAccountSet(selectedWalletAccount)) {
        return null;
    }

    const bitcoinAddressHelper = selectedWalletAccount[1]?.ID
        ? bitcoinAddressHelperByWalletAccountId[selectedWalletAccount[1].ID]
        : undefined;

    const reset = () => {
        dispatch(resetQuotesByProvider());
        setCountry(undefined);
        setQuote(undefined);
        setSelectedWalletAccount(defaultSelected);
        setOpenedModal('buy');
        setStepKey(StepKey.Location);
    };

    const handleClose = () => {
        modal.onClose?.();
        reset();
    };

    return (
        <>
            <FullscreenModal
                open={modal.open && openedModal === 'buy'}
                header={
                    <ModalHeaderWithStepper
                        onClose={handleClose}
                        onClickStep={(key) => {
                            setStepKey(key);
                        }}
                        currentStep={stepKey}
                        steps={getSteps()}
                    />
                }
            >
                <div className="flex flex-column items-center mb-8 wallet-fullscreen-modal-left">
                    <div className="sticky top-0 w-full">
                        {bitcoinAddressHelper?.receiveBitcoinAddress && (
                            <WalletAccountSelector
                                disabled={stepKey === StepKey.Onramp}
                                value={selectedWalletAccount}
                                onSelect={(selected) => {
                                    setSelectedWalletAccount(selected);
                                }}
                                options={toWalletAccountSelectorOptions(apiWalletsData ?? [])}
                            />
                        )}
                    </div>
                </div>

                <div>
                    <div className="wallet-fullscreen-modal-main">
                        {!bitcoinAddressHelper?.receiveBitcoinAddress ? (
                            <Loader />
                        ) : (
                            <>
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
                                            <AmountStep
                                                country={country}
                                                preselectedQuote={quote}
                                                btcAddress={bitcoinAddressHelper.receiveBitcoinAddress.address}
                                                onConfirm={(quote, checkoutUrl) => {
                                                    setQuote(quote);
                                                    setCheckoutUrl(checkoutUrl);
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
                                                checkoutUrl={checkoutUrl}
                                                onPurchaseComplete={() => {
                                                    reset();
                                                    setOpenedModal(
                                                        quote.provider === AZTECO ? 'in-progress' : 'confirm'
                                                    );
                                                }}
                                                onPurchaseCancelled={() => {
                                                    dispatch(resetQuotesByProvider());
                                                    setStepKey(StepKey.Amount);
                                                }}
                                                onBack={() => {
                                                    dispatch(resetQuotesByProvider());
                                                    setStepKey(StepKey.Amount);
                                                }}
                                            />
                                        );
                                    })()}
                            </>
                        )}
                    </div>
                </div>

                {/* empty div for grid centering */}
                <div className="wallet-fullscreen-modal-right" />
            </FullscreenModal>

            <BitcoinBuyConfirmModal
                open={Boolean(modal.open && openedModal === 'confirm')}
                onDone={handleClose}
                onBuyMoreBitcoin={() => {
                    setOpenedModal('buy');
                }}
            />

            <BitcoinBuyAztecoConfirmModal
                open={Boolean(modal.open && openedModal === 'confirm-azteco')}
                onDone={handleClose}
                onBuyMoreBitcoin={() => {
                    setOpenedModal('buy');
                }}
            />

            <BitcoinBuyInProgressModal
                open={Boolean(modal.open && openedModal === 'in-progress')}
                onDone={handleClose}
                onBuyMoreBitcoin={() => {
                    setOpenedModal('buy');
                }}
            />
        </>
    );
};
