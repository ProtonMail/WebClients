import { useEffect, useState } from 'react';

import { WalletAndAccountSelectorValue } from '../../../atoms';
import { useBlockchainContext } from '../../../contexts';
import { usePsbt } from '../../../hooks/usePsbt';
import { useRecipients } from '../../../hooks/useRecipients';
import { useTxBuilder } from '../../../hooks/useTxBuilder';
import { getDefaultAccount, getSelectedWallet } from '../../../utils';

export const useOnchainTransactionBuilder = (defaultWalletId?: number) => {
    const { wallets } = useBlockchainContext();

    const defaultWallet = getSelectedWallet(wallets, defaultWalletId);
    const [walletAndAccount, setWalletAndAccount] = useState<WalletAndAccountSelectorValue>({
        wallet: defaultWallet,
        account: getDefaultAccount(defaultWallet),
    });

    const { txBuilder, updateTxBuilder } = useTxBuilder();

    const { addRecipient, removeRecipient, updateRecipient, updateRecipientAmountToMax } =
        useRecipients(updateTxBuilder);

    const { finalPsbt, loadingBroadcast, broadcastedTxId, createPsbt, erasePsbt, signAndBroadcastPsbt } = usePsbt({
        walletAndAccount,
        txBuilder,
    });

    const handleSelectWalletAndAccount = (value: WalletAndAccountSelectorValue) => {
        setWalletAndAccount((prev) => ({ ...prev, ...value }));
    };

    useEffect(() => {
        setWalletAndAccount((prev) => ({ ...prev, account: getDefaultAccount(walletAndAccount.wallet) }));
    }, [walletAndAccount.wallet]);

    useEffect(() => {
        const account = walletAndAccount.account;
        if (account) {
            void updateTxBuilder((txBuilder) => txBuilder.setAccount(account.wasmAccount));
        }
    }, [walletAndAccount.account, updateTxBuilder]);

    return {
        walletAndAccount,
        handleSelectWalletAndAccount,

        addRecipient,
        removeRecipient,
        updateRecipient,
        updateRecipientAmountToMax,

        updateTxBuilder,
        txBuilder,

        finalPsbt,
        broadcastedTxId,
        loadingBroadcast,
        createPsbt,
        erasePsbt,
        signAndBroadcastPsbt,
    };
};
