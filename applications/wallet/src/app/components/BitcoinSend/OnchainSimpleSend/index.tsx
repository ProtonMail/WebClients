import { useEffect, useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button';
import { Card } from '@proton/atoms/Card';
import { CircleLoader } from '@proton/atoms/CircleLoader';

import { WasmBitcoinUnit, WasmPaymentLink } from '../../../../pkg';
import { WalletAndAccountSelectorValue, WalletSelector } from '../../../atoms';
import { useBlockchainContext } from '../../../contexts';
import { usePsbt } from '../../../hooks/usePsbt';
import { useRecipients } from '../../../hooks/useRecipients';
import { useTxBuilder } from '../../../hooks/useTxBuilder';
import { getDefaultAccount, getSelectedWallet } from '../../../utils';
import { OnChainFeesSelector } from '../OnchainFeesSelector';
import { OnchainTransactionAdvancedOptions } from '../OnchainTransactionAdvancedOptions';
import { OnchainTransactionBroadcastConfirmation } from '../OnchainTransactionBroadcastConfirmation';
import { OnchainTransactionReview } from '../OnchainTransactionReview';
import { RecipientList } from '../RecipientList';

interface Props {
    paymentLink?: WasmPaymentLink;
    defaultWalletId: number;
}

export const OnchainSimpleSend = ({ paymentLink, defaultWalletId }: Props) => {
    const { wallets } = useBlockchainContext();
    const { txBuilder, updateTxBuilder } = useTxBuilder();

    const { updateRecipient } = useRecipients(updateTxBuilder);

    const defaultWallet = getSelectedWallet(wallets, defaultWalletId);
    const [walletAndAccount, setWalletAndAccount] = useState({
        wallet: defaultWallet,
        account: getDefaultAccount(defaultWallet),
    });

    const handleSelectWalletAndAccount = (value: WalletAndAccountSelectorValue) => {
        setWalletAndAccount((prev) => ({ ...prev, ...value }));
    };

    const account = walletAndAccount.account;
    const { finalPsbt, loadingBroadcast, broadcastedTxId, createPsbt, erasePsbt, signAndBroadcastPsbt } = usePsbt({
        walletAndAccount,
        txBuilder,
    });

    useEffect(() => {
        const account = walletAndAccount.account?.wasmAccount;
        if (account) {
            void updateTxBuilder((txBuilder) => txBuilder.setAccount(account));
        }
    }, [walletAndAccount.account, updateTxBuilder]);

    useEffect(() => {
        if (!paymentLink) {
            return;
        }

        const data = paymentLink.assumeOnchain();

        void updateTxBuilder((txBuilder) =>
            txBuilder
                .clearRecipients()
                .addRecipient()
                .updateRecipient(0, data.address, Number(data.amount), WasmBitcoinUnit.SAT)
        );
    }, [paymentLink, updateTxBuilder]);

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
