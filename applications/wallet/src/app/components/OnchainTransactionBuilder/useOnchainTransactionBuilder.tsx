import { useCallback, useEffect, useState } from 'react';

import { c } from 'ttag';

import { SelectChangeEvent } from '@proton/components/components/selectTwo/select';
import { useNotifications } from '@proton/components/hooks';
import useLoading from '@proton/hooks/useLoading';

import { WasmClient, WasmNetwork, WasmPartiallySignedTransaction, WasmTxBuilder } from '../../../pkg';
import { BitcoinUnit, Recipient, WalletWithAccountsWithBalanceAndTxs } from '../../types';
import { getDefaultAccount, getSelectedAccount, getSelectedWallet, tryHandleWasmError } from '../../utils';

export type TempRecipient = Recipient & { uuid: number; unit: BitcoinUnit };

export const useOnchainTransactionBuilder = (
    wallets: WalletWithAccountsWithBalanceAndTxs[],
    defaultWalletId?: number
) => {
    const { createNotification } = useNotifications();
    const defaultWallet = getSelectedWallet(wallets, defaultWalletId);
    const [selectedWallet, setSelectedWallet] = useState(defaultWallet);
    const [finalPsbt, setFinalPsbt] = useState<WasmPartiallySignedTransaction>();
    const [txid, setTxid] = useState<string>();
    const [loadindBroadcast, withLoadingBroadcast] = useLoading();

    const [selectedAccount, setSelectedAccount] = useState(getDefaultAccount(selectedWallet));
    const [txBuilder, setTxBuilder] = useState<WasmTxBuilder>(new WasmTxBuilder());

    const updateTxBuilder = (updater: (txBuilder: WasmTxBuilder) => WasmTxBuilder) => {
        setTxBuilder(updater);
    };

    const handleSelectWallet = ({ value }: SelectChangeEvent<number>) => {
        const wallet = wallets.find(({ WalletID }) => WalletID === value);
        if (wallet) {
            setSelectedWallet(wallet);
        }
    };

    const handleSelectAccount = ({ value }: SelectChangeEvent<number>) => {
        const account = getSelectedAccount(selectedWallet, value);
        if (account) {
            setSelectedAccount(account);
        }
    };

    useEffect(() => {
        setSelectedAccount(getDefaultAccount(selectedWallet));
    }, [selectedWallet]);

    useEffect(() => {
        if (selectedAccount) {
            updateTxBuilder((txBuilder) => txBuilder.set_account(selectedAccount.wasmAccount));
        }
    }, [selectedAccount]);

    const addRecipient = useCallback(() => {
        updateTxBuilder((txBuilder) => txBuilder.add_recipient());
    }, []);

    const removeRecipient = useCallback((index) => {
        updateTxBuilder((txBuilder) => txBuilder.remove_recipient(index));
    }, []);

    const updateRecipient = useCallback(
        (index: number, update: Partial<TempRecipient>) => {
            if (!txBuilder.get_recipients()[index]) {
                return;
            }

            updateTxBuilder((txBuilder) =>
                txBuilder.update_recipient(index, update.address, update.amount ? BigInt(update.amount) : undefined)
            );
        },
        [txBuilder]
    );

    const createPsbt = () => {
        if (selectedAccount) {
            try {
                const psbt = txBuilder.create_pbst(selectedAccount.wasmAccount, WasmNetwork.Testnet);

                setFinalPsbt(psbt);
            } catch (err) {
                const msg = tryHandleWasmError(err);
                if (msg) {
                    createNotification({ text: msg, type: 'error' });
                }
            }
        }
    };

    const handleSignAndSend = () => {
        void withLoadingBroadcast(async () => {
            if (!finalPsbt || !selectedAccount) {
                return;
            }

            const signed = finalPsbt.sign(selectedAccount?.wasmAccount, WasmNetwork.Testnet);
            try {
                const txid = await new WasmClient().broadcast_psbt(signed);
                setTxid(txid);
            } catch (err) {
                const msg = tryHandleWasmError(err);
                createNotification({ text: msg ?? c('Wallet Send').t`Could not broadcast transaction`, type: 'error' });
            }
        });
    };

    return {
        selectedWallet,
        selectedAccount,
        handleSelectWallet,
        handleSelectAccount,
        addRecipient,
        removeRecipient,
        updateRecipient,

        updateTxBuilder,
        txBuilder,

        createPsbt,
        finalPsbt,
        backToTxBuilder: () => setFinalPsbt(undefined),

        handleSignAndSend,
        txid,
        loadindBroadcast,
    };
};
