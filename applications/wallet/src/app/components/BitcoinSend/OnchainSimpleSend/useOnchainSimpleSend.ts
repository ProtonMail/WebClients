import { useEffect, useState } from 'react';

import { WasmBitcoinUnit, WasmPaymentLink } from '../../../../pkg';
import { WalletAndAccountSelectorValue } from '../../../atoms';
import { useOnchainWalletContext } from '../../../contexts';
import { usePsbt } from '../../../hooks/usePsbt';
import { useRecipients } from '../../../hooks/useRecipients';
import { useTxBuilder } from '../../../hooks/useTxBuilder';
import { getDefaultAccount, getSelectedWallet } from '../../../utils';

export const useOnchainSimpleSend = (defaultWalletId?: string, paymentLink?: WasmPaymentLink) => {
    const { wallets } = useOnchainWalletContext();
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
        setWalletAndAccount((prev) => ({ ...prev, account: getDefaultAccount(walletAndAccount.wallet) }));
    }, [walletAndAccount.wallet]);

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

    return {
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
    };
};
