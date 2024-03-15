import { c } from 'ttag';

import { WasmPaymentLink } from '@proton/andromeda';
import { Card } from '@proton/atoms/Card';
import { CircleLoader } from '@proton/atoms/CircleLoader';
import { IWasmApiWalletData } from '@proton/wallet';

import { WalletSelector } from '../../../atoms';
import { OnchainTransactionBroadcastConfirmation } from '../OnchainTransactionBroadcastConfirmation';
import { OnchainTransactionBuilderFooter } from '../OnchainTransactionBuilderFooter';
import { OnchainTransactionReview } from '../OnchainTransactionReview';
import { RecipientList } from '../RecipientList';
import { useOnchainSimpleSend } from './useOnchainSimpleSend';

interface Props {
    paymentLink?: WasmPaymentLink;
    wallets: IWasmApiWalletData[];
    defaultWalletId?: string;
}

export const OnchainSimpleSend = ({ wallets, paymentLink, defaultWalletId }: Props) => {
    const {
        walletAndAccount,
        account,

        txBuilder,
        updateTxBuilder,

        finalPsbt,
        loadingBroadcast,
        broadcastedTxId,
        createPsbt,
        erasePsbt,
        signAndBroadcastPsbt,

        updateRecipient,
        handleSelectWalletAndAccount,
    } = useOnchainSimpleSend(wallets, defaultWalletId, paymentLink);

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

    if (finalPsbt) {
        return (
            <OnchainTransactionReview
                from={{
                    walletName: walletAndAccount?.apiWalletData?.Wallet.Name ?? '',
                    accountName: walletAndAccount?.apiAccount?.Label ?? '',
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
                title={c('Wallet Send').t`Send to`}
                recipients={txBuilder.getRecipients()}
                onRecipientUpdate={updateRecipient}
            />

            <OnchainTransactionBuilderFooter
                txBuilder={txBuilder}
                account={account}
                updateTxBuilder={updateTxBuilder}
                createPsbt={createPsbt}
            />
        </div>
    );
};
