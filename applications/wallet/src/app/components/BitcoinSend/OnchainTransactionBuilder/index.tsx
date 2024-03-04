import { c } from 'ttag';

import Card from '@proton/atoms/Card/Card';
import CircleLoader from '@proton/atoms/CircleLoader/CircleLoader';

import { WalletSelector } from '../../../atoms';
import { IWasmApiWalletData } from '../../../types';
import { OnchainFeesAndOptionsCard } from '../OnchainFeesAndOptionsCard';
import { OnchainTransactionBroadcastConfirmation } from '../OnchainTransactionBroadcastConfirmation';
import { OnchainTransactionReview } from '../OnchainTransactionReview';
import { RecipientList } from '../RecipientList';
import { useOnchainTransactionBuilder } from './useOnchainTransactionBuilder';

import './index.scss';

interface Props {
    wallets: IWasmApiWalletData[];
    defaultWalletId?: string;
}

export const OnchainTransactionBuilder = ({ wallets, defaultWalletId }: Props) => {
    const {
        walletAndAccount,
        account,

        handleSelectWalletAndAccount,

        txBuilder,
        addRecipient,
        removeRecipient,
        updateRecipient,
        updateTxBuilder,
        updateRecipientAmountToMax,

        finalPsbt,
        loadingBroadcast,
        broadcastedTxId,
        createPsbt,
        erasePsbt,
        signAndBroadcastPsbt,
    } = useOnchainTransactionBuilder(wallets, defaultWalletId);

    if (loadingBroadcast) {
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

    if (broadcastedTxId) {
        return <OnchainTransactionBroadcastConfirmation txid={broadcastedTxId} />;
    }

    if (finalPsbt && account) {
        return (
            <OnchainTransactionReview
                from={{
                    accountName: walletAndAccount.apiAccount?.Label ?? '',
                    walletName: walletAndAccount.apiWalletData?.Wallet.Name ?? '',
                }}
                psbt={finalPsbt}
                account={account}
                onBack={erasePsbt}
                onSignAndSend={signAndBroadcastPsbt}
            />
        );
    }

    return (
        <div className="pb-6 px-8 h-full flex flex-column flex-nowrap">
            <div className="flex flex-row">
                <WalletSelector
                    apiWalletsData={wallets}
                    value={walletAndAccount}
                    onSelect={handleSelectWalletAndAccount}
                    onlyValidWallet
                />
            </div>

            <hr className="mt-4 mb-0" />

            {/* Recipients list */}
            <RecipientList
                title={c('Wallet Send').t`Send to Recipient(s)`}
                recipients={txBuilder.getRecipients()}
                onRecipientAddition={addRecipient}
                onRecipientRemove={removeRecipient}
                onRecipientUpdate={updateRecipient}
                onRecipientMaxAmount={updateRecipientAmountToMax}
            />

            <OnchainFeesAndOptionsCard
                txBuilder={txBuilder}
                updateTxBuilder={updateTxBuilder}
                account={account}
                createPsbt={createPsbt}
            />
        </div>
    );
};
