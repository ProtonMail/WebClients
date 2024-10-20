import type { ChangeEvent } from 'react';
import { useCallback, useMemo, useState } from 'react';

import { c } from 'ttag';

import { useAddresses } from '@proton/account/addresses/hooks';
import type { WasmApiWalletAccount, WasmFiatCurrencySymbol } from '@proton/andromeda';
import { useNotifications, useUserKeys } from '@proton/components/hooks';
import useLoading from '@proton/hooks/useLoading';
import type { IWasmApiWalletData } from '@proton/wallet';
import { encryptWalletDataWithWalletKey, useWalletApiClients } from '@proton/wallet';
import { useFiatCurrencies, useWalletDispatch, walletAccountDeletion, walletAccountUpdate } from '@proton/wallet/store';

import { useBitcoinBlockchainContext } from '../../contexts';
import { getAccountWithChainDataFromManyWallets } from '../../utils';

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

    const { manageBitcoinAddressPool, walletsChainData } = useBitcoinBlockchainContext();
    const api = useWalletApiClients();
    const dispatch = useWalletDispatch();

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

    const addressesWithAvailability = useMemo(() => {
        const alreadyUsedAddresses = [wallet, ...otherWallets].flatMap(({ WalletAccounts }) =>
            WalletAccounts.flatMap(({ Addresses }) => Addresses.flatMap(({ ID }) => ID))
        );

        return addresses?.map((addr) => [addr, !alreadyUsedAddresses.includes(addr.ID)] as const) ?? [];
    }, [wallet, otherWallets, addresses]);

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

        return withLoadingFiatCurrencyUpdate(promise());
    };

    const onAddEmailAddress = (emailAddressId: string) => {
        const promise = async () => {
            try {
                const { Data: updatedAccount } = await api.wallet.addEmailAddress(
                    wallet.Wallet.ID,
                    walletAccount.ID,
                    emailAddressId
                );

                const accountChainData = getAccountWithChainDataFromManyWallets(
                    walletsChainData,
                    wallet.Wallet.ID,
                    updatedAccount.ID
                );

                if (accountChainData) {
                    await manageBitcoinAddressPool({
                        wallet: wallet.Wallet,
                        account: updatedAccount,
                        accountChainData,
                    }).catch(() => {
                        createNotification({
                            type: 'error',
                            text: c('Wallet Settings').t`Could not fill the pool after email address addition`,
                        });
                    });
                }

                createNotification({ text: c('Wallet Settings').t`Email address has been added` });
                dispatch(
                    walletAccountUpdate({
                        walletID: wallet.Wallet.ID,
                        walletAccountID: walletAccount.ID,
                        update: { Addresses: updatedAccount.Addresses },
                    })
                );
            } catch (error: any) {
                createNotification({
                    type: 'error',
                    text: error?.error ?? c('Wallet Settings').t`Email address could not be added. Please try again.`,
                });
            }
        };

        void withLoadingEmailUpdate(promise());
    };

    const onRemoveEmailAddress = (emailAddressId: string) => {
        const promise = async () => {
            try {
                const { Data: updatedAccount } = await api.wallet.removeEmailAddress(
                    wallet.Wallet.ID,
                    walletAccount.ID,
                    emailAddressId
                );

                createNotification({ text: c('Wallet Settings').t`Email address has been removed` });
                dispatch(
                    walletAccountUpdate({
                        walletID: wallet.Wallet.ID,
                        walletAccountID: walletAccount.ID,
                        update: { Addresses: updatedAccount.Addresses },
                    })
                );
            } catch (error: any) {
                createNotification({
                    type: 'error',
                    text: error?.error ?? c('Wallet Settings').t`Email address could not be removed. Please try again.`,
                });
            }
        };

        void withLoadingEmailUpdate(promise());
    };

    const onReplaceEmailAddress = (previousEmailAddressId: string, emailAddressId: string) => {
        const promise = async () => {
            try {
                // remove old email address
                await api.wallet.removeEmailAddress(wallet.Wallet.ID, walletAccount.ID, previousEmailAddressId);

                const { Data: updatedAccount } = await api.wallet.addEmailAddress(
                    wallet.Wallet.ID,
                    walletAccount.ID,
                    emailAddressId
                );

                const accountChainData = getAccountWithChainDataFromManyWallets(
                    walletsChainData,
                    wallet.Wallet.ID,
                    updatedAccount.ID
                );

                createNotification({ text: c('Wallet Settings').t`Email address has been replaced` });
                dispatch(
                    walletAccountUpdate({
                        walletID: wallet.Wallet.ID,
                        walletAccountID: walletAccount.ID,
                        update: { Addresses: updatedAccount.Addresses },
                    })
                );

                if (accountChainData) {
                    void manageBitcoinAddressPool({
                        wallet: wallet.Wallet,
                        account: updatedAccount,
                        accountChainData,
                    }).catch(() => {
                        createNotification({
                            type: 'error',
                            text: c('Wallet Settings').t`Could not fill the pool after email address replacement`,
                        });
                    });
                }
            } catch (error: any) {
                createNotification({
                    type: 'error',
                    text:
                        error?.error ??
                        c('Wallet Settings')
                            .t`An error occurred while modifying with your Bitcoin via Email address. Please check details and try again.`,
                });
            }
        };

        void withLoadingEmailUpdate(promise());
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
