import { useCallback, useEffect, useState } from 'react';

import { useUserKeys } from '@proton/components/hooks';
import useLoading from '@proton/hooks/useLoading';
import { IWasmApiWalletData, useApiWalletsData } from '@proton/wallet';

import { decryptWalletData } from '../utils/crypto';

export const useDecryptedApiWalletsData = () => {
    const [apiWalletsData, loadingWalletFetch] = useApiWalletsData();
    const [userKeys] = useUserKeys();
    const [loadingWalletDecryption, withLoadingDecryption] = useLoading();

    const [decryptedApiWalletsData, setDecryptedApiWalletsData] = useState<IWasmApiWalletData[]>();

    useEffect(() => {
        if (apiWalletsData && userKeys?.length) {
            void withLoadingDecryption(
                (async () => {
                    const apiWallets = await Promise.all(
                        apiWalletsData.map(async (apiWalletData) => {
                            // A wallet normally cannot be created without a wallet key
                            if (!apiWalletData.WalletKey || !apiWalletData.WalletSettings) {
                                return null;
                            }

                            const { Wallet, WalletKey, WalletSettings, WalletAccounts } = apiWalletData;
                            const encryptedLabels = WalletAccounts.map((account) => account.Label);

                            try {
                                const [decryptedMnemonic, decryptedPublickey, ...decryptedLabels] =
                                    await decryptWalletData(
                                        [Wallet.Mnemonic, Wallet.PublicKey, ...encryptedLabels],
                                        WalletKey.WalletKey,
                                        userKeys
                                    );

                                const decryptedWallet = {
                                    ...Wallet,
                                    ...(decryptedMnemonic && { Mnemonic: decryptedMnemonic }),
                                    ...(decryptedPublickey && { PublicKey: decryptedPublickey }),
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
                                    WalletKey: WalletKey,
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

                    setDecryptedApiWalletsData(
                        apiWallets.filter((apiWallet): apiWallet is IWasmApiWalletData => Boolean(apiWallet))
                    );
                })()
            );
        }
        // We don't want to include `withLoadingDecryption` because it is unstable between rerenders
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [apiWalletsData, userKeys]);

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

    return { decryptedApiWalletsData, loading: loadingWalletFetch || loadingWalletDecryption, setPassphrase };
};
