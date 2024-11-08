import { useMemo } from 'react';

import { c } from 'ttag';

import { useAddresses } from '@proton/account/addresses/hooks';
import type { WasmApiWalletAccount } from '@proton/andromeda';
import useNotifications from '@proton/components/hooks/useNotifications';
import useLoading from '@proton/hooks/useLoading';
import type { IWasmApiWalletData } from '@proton/wallet';
import { useWalletApiClients } from '@proton/wallet';
import { useWalletDispatch, walletAccountUpdate } from '@proton/wallet/store';

import { useBitcoinBlockchainContext } from '../contexts';
import { getAccountWithChainDataFromManyWallets } from '../utils';

export const useEmailIntegration = (
    wallet: IWasmApiWalletData,
    walletAccount: WasmApiWalletAccount,
    otherWallets: IWasmApiWalletData[]
) => {
    const [isLoadingEmailUpdate, withLoadingEmailUpdate] = useLoading();
    const { createNotification } = useNotifications();

    const [addresses] = useAddresses();

    const { manageBitcoinAddressPool, walletsChainData } = useBitcoinBlockchainContext();
    const api = useWalletApiClients();
    const dispatch = useWalletDispatch();

    const addressesWithAvailability = useMemo(() => {
        const alreadyUsedAddresses = [wallet, ...otherWallets].flatMap(({ WalletAccounts }) =>
            WalletAccounts.flatMap(({ Addresses }) => Addresses.flatMap(({ ID }) => ID))
        );

        return addresses?.map((addr) => [addr, !alreadyUsedAddresses.includes(addr.ID)] as const) ?? [];
    }, [wallet, otherWallets, addresses]);

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
        addressesWithAvailability,
        isLoadingEmailUpdate,

        onAddEmailAddress,
        onRemoveEmailAddress,
        onReplaceEmailAddress,
    };
};
