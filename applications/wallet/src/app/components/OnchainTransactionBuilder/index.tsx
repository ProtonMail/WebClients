import { c } from 'ttag';

import { Button } from '@proton/atoms/Button';
import { Card } from '@proton/atoms/Card';

import { Selector } from '../../atoms/Selector';
import { accounts, wallets } from '../../tests';
import { WalletKind } from '../../types';
import { OnChainFeesSelector } from '../OnchainFeesSelector';
import { OnchainTransactionAdvancedOptions } from '../OnchainTransactionAdvancedOptions';
import { RecipientList } from './RecipientList';
import { useOnchainTransactionBuilder } from './useOnchainTransactionBuilder';

import './index.scss';

interface Props {
    defaultWalletId?: string;
}

export const OnchainTransactionBuilder = ({ defaultWalletId }: Props) => {
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
    } = useOnchainTransactionBuilder(wallets, accounts, defaultWalletId);

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
                    selected={selectedWallet.id}
                    onSelect={handleSelectWallet}
                    options={wallets.map((wallet) => ({ value: wallet.id, label: wallet.name }))}
                />

                {selectedWallet.kind === WalletKind.ONCHAIN && (
                    <Selector
                        id="account-selector"
                        label={accountSelectorLabel}
                        selected={selectedAccount.id}
                        onSelect={handleSelectAccount}
                        options={accounts.map((account) => ({ value: account.id, label: account.name }))}
                    />
                )}
            </div>

            {/* Recipients list */}
            <div className="mt-6">
                <h3 className="text-rg text-semibold">{c('Wallet Send').t`Send to Recipient(s)`}</h3>

                <RecipientList
                    selectedWallet={selectedWallet}
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
