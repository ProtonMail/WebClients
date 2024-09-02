import { useCallback, useEffect, useMemo, useState } from 'react';

import compact from 'lodash/compact';

import { type WasmApiWalletAccount } from '@proton/andromeda';
import { useGetUserKeys } from '@proton/components/hooks/useUserKeys';
import useLoading from '@proton/hooks/useLoading';

import { useApiWalletsData } from '../store';
import { type IWasmApiWalletData } from '../types';
import { getPassphraseLocalStorageKey } from '../utils';
import { decryptWalletData, decryptWalletKey } from '../utils/crypto';
import { buildMapFromWallets } from '../utils/wallet';

export type WalletMap = Partial<
    Record<string, { wallet: IWasmApiWalletData; accounts: Partial<Record<string, WasmApiWalletAccount>> }>
>;

export const useDecryptedApiWalletsData = () => {
    const [apiWalletsData] = useApiWalletsData();

    const getUserKeys = useGetUserKeys();
    const [loadingApiWalletsData, withLoadingApiWalletsData] = useLoading();

    const [decryptedApiWalletsData, setDecryptedApiWalletsData] = useState<IWasmApiWalletData[]>();

    const getDecryptedApiWalletsData = useCallback(async (apiWalletsData: IWasmApiWalletData[]) => {
        const userKeys = await getUserKeys();

        const apiWallets = await Promise.all(
            apiWalletsData.map(async (apiWalletData) => {
                // A wallet normally cannot be created without a wallet key
                if (!apiWalletData.WalletKey || !apiWalletData.WalletSettings) {
                    return null;
                }

                const { Wallet, WalletKey, WalletSettings, WalletAccounts } = apiWalletData;
                const encryptedLabels = WalletAccounts.map((account) => account.Label);

                try {
                    const decryptedWalletKey = await decryptWalletKey(
                        WalletKey.WalletKey,
                        WalletKey.WalletKeySignature,
                        userKeys
                    );

                    const encryptedPassphrase = Wallet.Fingerprint
                        ? localStorage.getItem(getPassphraseLocalStorageKey(Wallet.Fingerprint))
                        : null;
                    const [
                        decryptedMnemonic,
                        decryptedWalletName,
                        decryptedPublickey,
                        decryptedPassphrase,
                        ...decryptedLabels
                    ] = await decryptWalletData(
                        [Wallet.Mnemonic, Wallet.Name, Wallet.PublicKey, encryptedPassphrase, ...encryptedLabels],
                        decryptedWalletKey
                    );

                    const decryptedWallet = {
                        ...Wallet,
                        ...(decryptedWalletName && { Name: decryptedWalletName }),
                        ...(decryptedMnemonic && { Mnemonic: decryptedMnemonic }),
                        ...(decryptedPublickey && { PublicKey: decryptedPublickey }),
                        ...(decryptedPassphrase && { Passphrase: decryptedPassphrase }),
                    };

                    const decryptedAccounts = WalletAccounts.map((account, index) => {
                        const decryptedLabel = decryptedLabels[index];
                        return {
                            ...account,
                            ...(decryptedLabel && { Label: decryptedLabel }),
                        };
                    });

                    const data: IWasmApiWalletData = {
                        Wallet: decryptedWallet,
                        WalletAccounts: decryptedAccounts,
                        WalletKey: { ...WalletKey, DecryptedKey: decryptedWalletKey },
                        WalletSettings: WalletSettings,
                    };

                    return data;
                } catch (e) {
                    const data: IWasmApiWalletData = {
                        Wallet,
                        WalletKey,
                        WalletSettings,
                        WalletAccounts,
                        IsNotDecryptable: true,
                    };

                    return data;
                }
            })
        );

        const wallets = compact(apiWallets);

        setDecryptedApiWalletsData(wallets);
        return wallets;
    }, []);

    useEffect(() => {
        if (apiWalletsData) {
            void withLoadingApiWalletsData(getDecryptedApiWalletsData(apiWalletsData));
        }
    }, [apiWalletsData]);

    const setPassphrase = useCallback((walletId: string, Passphrase: string) => {
        setDecryptedApiWalletsData((prev) => {
            if (!prev) {
                return undefined;
            }

            const walletIndex = prev?.findIndex((value) => value.Wallet.ID === walletId);

            const updated: IWasmApiWalletData = {
                ...prev[walletIndex],
                Wallet: { ...prev[walletIndex].Wallet, Passphrase },
            };

            return walletIndex > -1 ? [...prev.slice(0, walletIndex), updated, ...prev.slice(walletIndex + 1)] : prev;
        });
    }, []);

    const walletMap: WalletMap = useMemo(() => {
        return buildMapFromWallets(decryptedApiWalletsData);
    }, [decryptedApiWalletsData]);

    /**
     * We want to display a loading state either when we are fetching api data or when we are decrypting it and we don't have data on client yet
     */
    const loading = loadingApiWalletsData && !decryptedApiWalletsData;

    return {
        decryptedApiWalletsData,
        getDecryptedApiWalletsData,

        walletMap,
        loading,
        setPassphrase,
    };
};
