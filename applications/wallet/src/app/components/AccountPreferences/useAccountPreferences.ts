import { ChangeEvent, useCallback, useMemo, useState } from 'react';

import { c } from 'ttag';

import { WasmApiWalletAccount, WasmFiatCurrencySymbol } from '@proton/andromeda';
import { useAddresses, useNotifications, useUserKeys } from '@proton/components/hooks';
import useLoading from '@proton/hooks/useLoading';
import { useDispatch } from '@proton/redux-shared-store';
import {
    IWasmApiWalletData,
    encryptWalletDataWithWalletKey,
    useWalletApiClients,
    walletAccountDeletion,
    walletAccountUpdate,
} from '@proton/wallet';

import { useFiatCurrencies } from '../../store/hooks';

export const useAccountPreferences = (
    wallet: IWasmApiWalletData,
    walletAccount: WasmApiWalletAccount,
    otherWallets: IWasmApiWalletData[]
) => {
    const [label, setLabel] = useState(walletAccount.Label);
    const [currencies, loadingCurrencies] = useFiatCurrencies();
    const [isLoadingEmailUpdate, withLoadingEmailUpdate] = useLoading();
    const [isLoadingFiatCurrencyUpdate, withLoadingFiatCurrencyUpdate] = useLoading();
    const [isLoadingLabelUpdate, withLoadingLabelUpdate] = useLoading();
    const { createNotification } = useNotifications();
    const [userKeys] = useUserKeys();

    const api = useWalletApiClients();
    const dispatch = useDispatch();

    const [addresses] = useAddresses();

    const onChangeLabel = (e: ChangeEvent<HTMLInputElement>) => {
        setLabel(e.target.value);
    };

    const updateWalletAccountLabel = useCallback(() => {
        const promise = async () => {
            if (!userKeys || !wallet.WalletKey?.DecryptedKey || label === walletAccount.Label) {
                return;
            }

            const [encryptedWalletName] = await encryptWalletDataWithWalletKey([label], wallet.WalletKey.DecryptedKey);

            try {
                const { Data: updatedAccount } = await api.wallet.updateWalletAccountLabel(
                    wallet.Wallet.ID,
                    walletAccount.ID,
                    encryptedWalletName
                );

                createNotification({ text: c('Wallet Settings').t`Account name changed` });
                dispatch(walletAccountUpdate(updatedAccount));
            } catch (e) {
                createNotification({ type: 'error', text: c('Wallet Settings').t`Account name could not be change` });
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
            } catch (e) {
                createNotification({ type: 'error', text: c('Wallet Settings').t`Account could not be deleted` });
            }
        };

        void withLoadingLabelUpdate(promise());
    }, [api.wallet, createNotification, dispatch, wallet.Wallet.ID, walletAccount.ID, withLoadingLabelUpdate]);

    const addressesWithAvailability = useMemo(() => {
        const alreadyUsedAddresses = [wallet, ...otherWallets].flatMap(({ WalletAccounts }) =>
            WalletAccounts.flatMap(({ Addresses }) => Addresses.flatMap(({ ID }) => ID))
        );

        return addresses?.map((addr) => [addr, !alreadyUsedAddresses.includes(addr.ID)] as const) ?? [];
    }, [wallet, otherWallets, addresses]);

    const onChangeFiatCurrency = async (fiatCurrency: WasmFiatCurrencySymbol) => {
        const promise = async () => {
            try {
                const { Data: updatedAccount } = await api.wallet.updateWalletAccountFiatCurrency(
                    wallet.Wallet.ID,
                    walletAccount.ID,
                    fiatCurrency
                );

                createNotification({ text: c('Wallet Settings').t`New fiat currency applied` });
                dispatch(walletAccountUpdate(updatedAccount));
            } catch (e) {
                createNotification({
                    type: 'error',
                    text: c('Wallet Settings').t`New fiat currency could not be applied`,
                });
            }
        };

        return withLoadingFiatCurrencyUpdate(promise());
    };

    const onAddEmailAddresses = async (emailAddressIds: string[]) => {
        const promise = async () => {
            let updatedAccount = walletAccount;
            for (const emailAddressId of emailAddressIds) {
                try {
                    const { Data } = await api.wallet.addEmailAddress(
                        wallet.Wallet.ID,
                        walletAccount.ID,
                        emailAddressId
                    );
                    updatedAccount = Data;
                } catch {
                    createNotification({ type: 'error', text: c('Wallet Settings').t`Could not add email address` });
                }
            }

            createNotification({ text: c('Wallet Settings').t`Email addresses were added` });
            dispatch(walletAccountUpdate(updatedAccount));
        };

        return withLoadingEmailUpdate(promise());
    };

    const onRemoveEmailAddress = async (emailAddressId: string) => {
        const promise = async () => {
            try {
                const { Data: updatedAccount } = await api.wallet.removeEmailAddress(
                    wallet.Wallet.ID,
                    walletAccount.ID,
                    emailAddressId
                );

                createNotification({ text: c('Wallet Settings').t`Email address has been removed` });
                dispatch(walletAccountUpdate(updatedAccount));
            } catch (e) {
                createNotification({ type: 'error', text: c('Wallet Settings').t`Could not remove email address` });
            }
        };

        return withLoadingEmailUpdate(promise());
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
        onAddEmailAddresses,
        onRemoveEmailAddress,
    };
};
