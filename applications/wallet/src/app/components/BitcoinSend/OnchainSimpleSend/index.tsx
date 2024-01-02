import { c } from 'ttag';

import { Button } from '@proton/atoms/Button';
import { Card } from '@proton/atoms/Card';
import { CircleLoader } from '@proton/atoms/CircleLoader';

import { WasmPaymentLink } from '../../../../pkg';
import { WalletSelector } from '../../../atoms';
import { OnChainFeesSelector } from '../OnchainFeesSelector';
import { OnchainTransactionAdvancedOptions } from '../OnchainTransactionAdvancedOptions';
import { OnchainTransactionBroadcastConfirmation } from '../OnchainTransactionBroadcastConfirmation';
import { OnchainTransactionReview } from '../OnchainTransactionReview';
import { RecipientList } from '../RecipientList';
import { useOnchainSimpleSend } from './useOnchainSimpleSend';

interface Props {
    paymentLink?: WasmPaymentLink;
    defaultWalletId: number;
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
                from={{ accountName: account?.Label ?? '', walletName: walletAndAccount?.wallet?.Name ?? '' }}
                psbt={finalPsbt}
                account={account?.wasmAccount}
                onBack={erasePsbt}
                onSignAndSend={signAndBroadcastPsbt}
            />
        );
    }

    return (
        <div className="pb-6 px-8 h-full flex flex-column">
            <div className="flex flex-row">
                <WalletSelector wallets={wallets} value={walletAndAccount} onSelect={handleSelectWalletAndAccount} />
            </div>

            {/* Recipients list */}
            <div className="mt-6">
                <h3 className="text-rg text-semibold">{c('Wallet Send').t`Send to`}</h3>
                <RecipientList recipients={txBuilder.getRecipients()} onRecipientUpdate={updateRecipient} />
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
                    account={walletAndAccount.account}
                />
                <hr className="my-2 bg-weak" />
                <Button
                    color="norm"
                    className="mt-4 ml-auto"
                    onClick={() => {
                        void createPsbt();
                    }}
                >
                    {c('Wallet Send').t`Review transaction`}
                </Button>
            </Card>
        </div>
    );
};
