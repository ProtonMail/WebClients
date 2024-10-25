import type { ChangeEvent } from 'react';
import { useCallback, useState } from 'react';

import { c } from 'ttag';

import { useUserKeys } from '@proton/account/userKeys/hooks';
import type { WasmApiWalletAccount, WasmFiatCurrencySymbol } from '@proton/andromeda';
import { useNotifications } from '@proton/components/hooks';
import useLoading from '@proton/hooks/useLoading';
import type { IWasmApiWalletData } from '@proton/wallet';
import { encryptWalletDataWithWalletKey, useWalletApiClients } from '@proton/wallet';
import { useFiatCurrencies, useWalletDispatch, walletAccountDeletion, walletAccountUpdate } from '@proton/wallet/store';

import { useEmailIntegration } from '../../hooks/useEmailIntegration';

export const useAccountPreferences = (
    wallet: IWasmApiWalletData,
    walletAccount: WasmApiWalletAccount,
    otherWallets: IWasmApiWalletData[]
) => {
    const [label, setLabel] = useState(walletAccount.Label);
    const [currencies, loadingCurrencies] = useFiatCurrencies();
    const [isLoadingFiatCurrencyUpdate, withLoadingFiatCurrencyUpdate] = useLoading();
    const [isLoadingLabelUpdate, withLoadingLabelUpdate] = useLoading();
    const { createNotification } = useNotifications();
    const [userKeys] = useUserKeys();

    const api = useWalletApiClients();
    const dispatch = useWalletDispatch();

    const onChangeLabel = (e: ChangeEvent<HTMLInputElement>) => {
        setLabel(e.target.value);
    };

    const {
        addressesWithAvailability,
        isLoadingEmailUpdate,
        onAddEmailAddress,
        onRemoveEmailAddress,
        onReplaceEmailAddress,
    } = useEmailIntegration(wallet, walletAccount, otherWallets);

    const updateWalletAccountLabel = useCallback(() => {
        const promise = async () => {
            if (!userKeys || !wallet.WalletKey?.DecryptedKey || label === walletAccount.Label) {
                return;
            }

            const [encryptedWalletName] = await encryptWalletDataWithWalletKey([label], wallet.WalletKey.DecryptedKey);

            try {
                await api.wallet.updateWalletAccountLabel(wallet.Wallet.ID, walletAccount.ID, encryptedWalletName);

                createNotification({ text: c('Wallet Settings').t`Account name changed` });
                dispatch(
                    walletAccountUpdate({
                        walletID: wallet.Wallet.ID,
                        walletAccountID: walletAccount.ID,
                        update: { Label: label },
                    })
                );
            } catch (error: any) {
                createNotification({
                    type: 'error',
                    text:
                        error?.error ??
                        c('Wallet Settings').t`Wallet account name could not be changed. Please try again.`,
                });
            }
        };

        void withLoadingLabelUpdate(promise());
    }, [
        api,
        createNotification,
        dispatch,
        label,
        userKeys,
        wallet.Wallet.ID,
        wallet.WalletKey?.DecryptedKey,
        walletAccount.ID,
        walletAccount.Label,
        withLoadingLabelUpdate,
    ]);

    const deleteWalletAccount = useCallback(() => {
        const promise = async () => {
            try {
                await api.wallet.deleteWalletAccount(wallet.Wallet.ID, walletAccount.ID);

                createNotification({ text: c('Wallet Settings').t`Account was deleted` });
                dispatch(walletAccountDeletion({ walletID: wallet.Wallet.ID, walletAccountID: walletAccount.ID }));
            } catch (error: any) {
                createNotification({
                    type: 'error',
                    text:
                        error?.error ?? c('Wallet Settings').t`Wallet account could not be deleted. Please try again.`,
                });
            }
        };

        void withLoadingLabelUpdate(promise());
    }, [api.wallet, createNotification, dispatch, wallet.Wallet.ID, walletAccount.ID, withLoadingLabelUpdate]);

    const onChangeFiatCurrency = (fiatCurrency: WasmFiatCurrencySymbol) => {
        const promise = async () => {
            try {
                await api.wallet.updateWalletAccountFiatCurrency(wallet.Wallet.ID, walletAccount.ID, fiatCurrency);

                createNotification({ text: c('Wallet Settings').t`New fiat currency applied` });
                dispatch(
                    walletAccountUpdate({
                        walletID: wallet.Wallet.ID,
                        walletAccountID: walletAccount.ID,
                        update: { FiatCurrency: fiatCurrency },
                    })
                );
            } catch (error: any) {
                createNotification({
                    type: 'error',
                    text: error?.error ?? c('Wallet Settings').t`Fiat currency could not be updated. Please try again.`,
                });
            }
        };

        void withLoadingFiatCurrencyUpdate(promise());
    };

    return {
        label,
        isLoadingLabelUpdate,
        onChangeLabel,
        updateWalletAccountLabel,

        deleteWalletAccount,

        currencies,
        loadingCurrencies,

        isLoadingFiatCurrencyUpdate,
        onChangeFiatCurrency,

        addressesWithAvailability,
        isLoadingEmailUpdate,

        onAddEmailAddress,
        onRemoveEmailAddress,
        onReplaceEmailAddress,
    };
};
