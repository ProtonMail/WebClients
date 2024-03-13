import { useEffect, useMemo, useState } from 'react';

import { WasmPaymentLink } from '@proton/andromeda';
import { IWasmApiWalletData } from '@proton/wallet';

import { WalletAndAccountSelectorValue } from '../../../atoms';
import { useBitcoinBlockchainContext } from '../../../contexts';
import { usePsbt } from '../../../hooks/usePsbt';
import { useRecipients } from '../../../hooks/useRecipients';
import { useTxBuilder } from '../../../hooks/useTxBuilder';
import { getAccountWithChainDataFromManyWallets, getDefaultAccount, getSelectedWallet } from '../../../utils';

export const useOnchainSimpleSend = (
    wallets: IWasmApiWalletData[],
    defaultWalletId?: string,
    paymentLink?: WasmPaymentLink
) => {
    const { walletsChainData } = useBitcoinBlockchainContext();

    const { txBuilder, updateTxBuilder } = useTxBuilder();

    const { updateRecipient } = useRecipients(updateTxBuilder);

    const defaultWallet = getSelectedWallet(wallets, defaultWalletId);
    const [walletAndAccount, setWalletAndAccount] = useState<WalletAndAccountSelectorValue>({
        apiWalletData: defaultWallet,
        apiAccount: getDefaultAccount(defaultWallet),
    });

    const handleSelectWalletAndAccount = (value: WalletAndAccountSelectorValue) => {
        setWalletAndAccount((prev) => ({ ...prev, ...value }));
    };

    const { finalPsbt, loadingBroadcast, broadcastedTxId, createPsbt, erasePsbt, signAndBroadcastPsbt } = usePsbt({
        walletAndAccount,
        txBuilder,
    });

    const account = useMemo(
        () =>
            getAccountWithChainDataFromManyWallets(
                walletsChainData,
                walletAndAccount.apiWalletData?.Wallet.ID,
                walletAndAccount.apiAccount?.ID
            ),
        [walletAndAccount, walletsChainData]
    );

    useEffect(() => {
        setWalletAndAccount((prev) => ({ ...prev, account: getDefaultAccount(walletAndAccount.apiWalletData) }));
    }, [walletAndAccount.apiWalletData]);

    useEffect(() => {
        if (account) {
            void updateTxBuilder((txBuilder) => txBuilder.setAccount(account.account));
        }
    }, [updateTxBuilder, account]);

    useEffect(() => {
        if (!paymentLink) {
            return;
        }

        const data = paymentLink.assumeOnchain();

        void updateTxBuilder((txBuilder) =>
            txBuilder.clearRecipients().addRecipient().updateRecipient(0, data.address, Number(data.amount), 'SATS')
        );
    }, [paymentLink, updateTxBuilder]);

    return {
        walletAndAccount,
        wallets,
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
    };
};
