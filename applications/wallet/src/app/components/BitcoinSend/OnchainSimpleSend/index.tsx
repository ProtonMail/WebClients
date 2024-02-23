import { c } from 'ttag';

import { Card } from '@proton/atoms/Card';
import { CircleLoader } from '@proton/atoms/CircleLoader';

import { WasmPaymentLink } from '../../../../pkg';
import { WalletSelector } from '../../../atoms';
import { OnchainFeesAndOptionsCard } from '../OnchainFeesAndOptionsCard';
import { OnchainTransactionBroadcastConfirmation } from '../OnchainTransactionBroadcastConfirmation';
import { OnchainTransactionReview } from '../OnchainTransactionReview';
import { RecipientList } from '../RecipientList';
import { useOnchainSimpleSend } from './useOnchainSimpleSend';

interface Props {
    paymentLink?: WasmPaymentLink;
    defaultWalletId?: string;
}

export const OnchainSimpleSend = ({ paymentLink, defaultWalletId }: Props) => {
    const {
        walletAndAccount,
        wallets,

        txBuilder,
        updateTxBuilder,

        finalPsbt,
        loadingBroadcast,
        broadcastedTxId,
        createPsbt,
        erasePsbt,
        signAndBroadcastPsbt,

        account,

        updateRecipient,
        handleSelectWalletAndAccount,
    } = useOnchainSimpleSend(defaultWalletId, paymentLink);

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
                from={{ accountName: account?.Label ?? '', walletName: walletAndAccount?.wallet?.Wallet.Name ?? '' }}
                psbt={finalPsbt}
                account={account?.wasmAccount}
                onBack={erasePsbt}
                onSignAndSend={signAndBroadcastPsbt}
            />
        );
    }

    return (
        <div className="pb-6 px-8 h-full flex flex-column flex-nowrap">
            <div className="flex flex-row">
                <WalletSelector wallets={wallets} value={walletAndAccount} onSelect={handleSelectWalletAndAccount} />
            </div>

            <hr className="mt-4 mb-0" />

            {/* Recipients list */}
            <RecipientList
                title={c('Wallet Send').t`Send to`}
                recipients={txBuilder.getRecipients()}
                onRecipientUpdate={updateRecipient}
            />

            <OnchainFeesAndOptionsCard
                txBuilder={txBuilder}
                updateTxBuilder={updateTxBuilder}
                account={walletAndAccount.account}
                createPsbt={createPsbt}
            />
        </div>
    );
};
