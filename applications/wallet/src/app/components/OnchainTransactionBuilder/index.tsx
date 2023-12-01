import { c } from 'ttag';

import { Button } from '@proton/atoms/Button';
import { Card } from '@proton/atoms/Card';

import { Selector } from '../../atoms/Selector';
import { WalletWithAccountsWithBalanceAndTxs } from '../../types';
import { WalletType } from '../../types/api';
import { OnChainFeesSelector } from '../OnchainFeesSelector';
import { OnchainTransactionAdvancedOptions } from '../OnchainTransactionAdvancedOptions';
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
        recipients,
        handleSelectWallet,
        handleSelectAccount,
        addRecipient,
        removeRecipient,
        updateRecipient,
        updateRecipientAmount,
    } = useOnchainTransactionBuilder(wallets, defaultWalletId);

    const [walletSelectorLabel, accountSelectorLabel] = [
        c('Wallet Send').t`Send from wallet`,
        c('Wallet Send').t`with account`,
    ];

    return (
        <div className="pb-6 px-8">
            {/* Wallet selector */}
            <div className="flex w-full flex-row">
                <Selector
                    id="wallet-selector"
                    label={walletSelectorLabel}
                    selected={selectedWallet.WalletID}
                    onSelect={handleSelectWallet}
                    options={wallets.map((wallet) => ({ value: wallet.WalletID, label: wallet.Name }))}
                />

                {selectedWallet.Type === WalletType.OnChain && (
                    <Selector
                        id="account-selector"
                        label={accountSelectorLabel}
                        selected={selectedAccount.WalletAccountID}
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
                    recipients={recipients}
                    onRecipientAddition={addRecipient}
                    onRecipientRemove={removeRecipient}
                    onRecipientUpdate={updateRecipient}
                    onRecipientAmountUpdate={updateRecipientAmount}
                />
            </div>

            <Card
                className="flex flex-column transaction-builder-card bg-norm"
                bordered={false}
                background={false}
                rounded
            >
                <OnChainFeesSelector />
                <hr className="my-2 bg-weak" />
                <OnchainTransactionAdvancedOptions />
                <hr className="my-2 bg-weak" />
                {/* TODO: Connect this to proton-wallet-common lib */}
                <Button color="norm" className="mt-4 ml-auto">
                    {c('Wallet Send').t`Review transaction`}
                </Button>
            </Card>
        </div>
    );
};
