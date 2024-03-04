import { useEffect, useMemo, useState } from 'react';

import { WalletAndAccountSelectorValue } from '../../../atoms';
import { useBitcoinBlockchainContext } from '../../../contexts';
import { usePsbt } from '../../../hooks/usePsbt';
import { useRecipients } from '../../../hooks/useRecipients';
import { useTxBuilder } from '../../../hooks/useTxBuilder';
import { IWasmApiWalletData } from '../../../types';
import { getAccountWithChainDataFromManyWallets, getDefaultAccount, getSelectedWallet } from '../../../utils';

export const useOnchainTransactionBuilder = (wallets: IWasmApiWalletData[], defaultWalletId?: string) => {
    const { walletsChainData } = useBitcoinBlockchainContext();

    const defaultWallet = getSelectedWallet(wallets, defaultWalletId);
    const [walletAndAccount, setWalletAndAccount] = useState<WalletAndAccountSelectorValue>({
        apiWalletData: defaultWallet,
        apiAccount: getDefaultAccount(defaultWallet),
    });

    const { txBuilder, updateTxBuilder } = useTxBuilder();

    const { addRecipient, removeRecipient, updateRecipient, updateRecipientAmountToMax } =
        useRecipients(updateTxBuilder);

    const { finalPsbt, loadingBroadcast, broadcastedTxId, createPsbt, erasePsbt, signAndBroadcastPsbt } = usePsbt({
        walletAndAccount,
        txBuilder,
    });

    const andromedaAccount = useMemo(
        () =>
            getAccountWithChainDataFromManyWallets(
                walletsChainData,
                walletAndAccount.apiWalletData?.Wallet.ID,
                walletAndAccount.apiAccount?.ID
            ),
        [walletAndAccount, walletsChainData]
    );

    const handleSelectWalletAndAccount = (value: WalletAndAccountSelectorValue) => {
        setWalletAndAccount((prev) => ({ ...prev, ...value }));
    };

    useEffect(() => {
        setWalletAndAccount((prev) => ({ ...prev, apiAccount: getDefaultAccount(walletAndAccount.apiWalletData) }));
    }, [walletAndAccount.apiWalletData]);

    const { apiWalletData: wallet, apiAccount: account } = walletAndAccount;

    useEffect(() => {
        if (wallet?.Wallet.ID && account?.ID) {
            const andromedaAccount = walletsChainData[wallet?.Wallet.ID]?.accounts[account?.ID]?.account;

            if (andromedaAccount) {
                void updateTxBuilder((txBuilder) => txBuilder.setAccount(andromedaAccount));
            }
        }
    }, [wallet?.Wallet.ID, account?.ID, updateTxBuilder, walletsChainData]);

    return {
        walletAndAccount,
        wallets,
        account: andromedaAccount,

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
