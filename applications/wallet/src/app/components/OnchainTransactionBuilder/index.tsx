import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import Card from '@proton/atoms/Card/Card';
import CircleLoader from '@proton/atoms/CircleLoader/CircleLoader';

import { Selector } from '../../atoms/Selector';
import { WalletWithAccountsWithBalanceAndTxs } from '../../types';
import { WalletType } from '../../types/api';
import { OnChainFeesSelector } from '../OnchainFeesSelector';
import { OnchainTransactionAdvancedOptions } from '../OnchainTransactionAdvancedOptions';
import { OnchainTransactionBroadcastConfirmation } from '../OnchainTransactionBroadcastConfirmation';
import { OnchainTransactionDetails } from '../OnchainTransactionDetails';
import { RecipientList } from './RecipientList';
import { useOnchainTransactionBuilder } from './useOnchainTransactionBuilder';

import './index.scss';

interface Props {
    defaultWalletId?: number;
    wallets: WalletWithAccountsWithBalanceAndTxs[];
}

export const OnchainTransactionBuilder = ({ defaultWalletId, wallets }: Props) => {
    const {
        selectedWallet,
        selectedAccount,
        handleSelectWallet,
        handleSelectAccount,
        addRecipient,
        removeRecipient,
        updateRecipient,
        txBuilder,
        updateTxBuilder,
        createPsbt,
        finalPsbt,
        backToTxBuilder,
        txid,
        handleSignAndSend,
        loadindBroadcast,
        unitByRecipient,
    } = useOnchainTransactionBuilder(wallets, defaultWalletId);

    const [walletSelectorLabel, accountSelectorLabel] = [
        c('Wallet Send').t`Send from wallet`,
        c('Wallet Send').t`with account`,
    ];

    if (loadindBroadcast) {
        return (
            <Card
                className="flex flex-column transaction-builder-card bg-norm flex-1 overflow-y-auto flex-nowrap mx-4"
                bordered={false}
                background={false}
                rounded
            >
                <CircleLoader size="large" className="mx-auto my-14" />
            </Card>
        );
    }

    if (txid) {
        return <OnchainTransactionBroadcastConfirmation txid={txid} />;
    }

    if (finalPsbt && selectedAccount) {
        return (
            <OnchainTransactionDetails
                from={{ accountName: selectedAccount?.Label ?? '', walletName: selectedWallet?.Name ?? '' }}
                psbt={finalPsbt}
                account={selectedAccount?.wasmAccount}
                onBack={backToTxBuilder}
                onSignAndSend={() => handleSignAndSend()}
            />
        );
    }

    return (
        <div className="pb-6 px-8 h-full flex flex-column">
            {/* Wallet selector */}
            <div className="flex w-full flex-row">
                <Selector
                    id="wallet-selector"
                    label={walletSelectorLabel}
                    selected={selectedWallet?.WalletID}
                    onSelect={handleSelectWallet}
                    options={wallets.map((wallet) => ({ value: wallet.WalletID, label: wallet.Name }))}
                />

                {selectedWallet?.Type === WalletType.OnChain && (
                    <Selector
                        id="account-selector"
                        label={accountSelectorLabel}
                        selected={selectedAccount?.WalletAccountID}
                        onSelect={handleSelectAccount}
                        options={selectedWallet.accounts.map((account) => ({
                            value: account.WalletAccountID,
                            label: account.Label,
                        }))}
                    />
                )}
            </div>

            {/* Recipients list */}
            <div className="mt-6">
                <h3 className="text-rg text-semibold">{c('Wallet Send').t`Send to Recipient(s)`}</h3>

                <RecipientList
                    selectedAccount={selectedAccount}
                    unitByRecipient={unitByRecipient}
                    recipients={txBuilder.get_recipients()}
                    onRecipientAddition={addRecipient}
                    onRecipientRemove={removeRecipient}
                    onRecipientUpdate={updateRecipient}
                />
            </div>

            <Card
                className="flex flex-column transaction-builder-card bg-norm flex-1 overflow-y-auto flex-nowrap"
                bordered={false}
                background={false}
                rounded
            >
                <OnChainFeesSelector txBuilder={txBuilder} updateTxBuilder={updateTxBuilder} />
                <hr className="my-2 bg-weak" />
                <OnchainTransactionAdvancedOptions
                    txBuilder={txBuilder}
                    updateTxBuilder={updateTxBuilder}
                    account={selectedAccount}
                />
                <hr className="my-2 bg-weak" />
                <Button
                    color="norm"
                    className="mt-4 ml-auto"
                    onClick={() => {
                        createPsbt();
                    }}
                >
                    {c('Wallet Send').t`Review transaction`}
                </Button>
            </Card>
        </div>
    );
};
