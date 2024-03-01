import { useEffect, useState } from 'react';

import { useUserKeys } from '@proton/components/hooks';
import useLoading from '@proton/hooks/useLoading';

import { useUserWallets } from '../store/hooks';
import { IWasmWallet } from '../types';
import { decryptWalletData } from '../utils/crypto';

export const useDecryptedWallets = () => {
    const [encryptedWallets, loading] = useUserWallets();
    const [userKeys] = useUserKeys();
    const [loadingDecryption, withLoadingDecryption] = useLoading();

    const [decryptedWallets, setDecryptedWallets] = useState<IWasmWallet[]>();

    useEffect(() => {
        if (encryptedWallets && userKeys?.length) {
            void withLoadingDecryption(
                (async () => {
                    const wallets = await Promise.all(
                        encryptedWallets.map(async (walletData) => {
                            // A wallet normally cannot be created without a wallet key
                            if (!walletData.WalletKey || !walletData.WalletSettings) {
                                return null;
                            }

                            const encryptedLabels = walletData.WalletAccounts.map((account) => account.Label);

                            try {
                                const [decryptedMnemonic, decryptedPublickey, ...decryptedLabels] =
                                    await decryptWalletData(
                                        [walletData.Wallet.Mnemonic, walletData.Wallet.PublicKey, ...encryptedLabels],
                                        walletData.WalletKey.WalletKey,
                                        userKeys
                                    );

                                const decryptedWallet = {
                                    ...walletData.Wallet,
                                    ...(decryptedMnemonic && { Mnemonic: decryptedMnemonic }),
                                    ...(decryptedPublickey && { PublicKey: decryptedPublickey }),
                                };

                                const decryptedAccounts = walletData.WalletAccounts.map((account, index) => {
                                    const decryptedLabel = decryptedLabels[index];
                                    return {
                                        ...account,
                                        ...(decryptedLabel && { Label: decryptedLabel }),
                                    };
                                });

                                const data: IWasmWallet = {
                                    Wallet: decryptedWallet,
                                    WalletAccounts: decryptedAccounts,
                                    WalletKey: walletData.WalletKey,
                                    WalletSettings: walletData.WalletSettings,
                                };

                                return data;
                            } catch {
                                // TODO: handle decryption errors
                                return null;
                            }
                        })
                    );

                    setDecryptedWallets(wallets.filter((wallet): wallet is IWasmWallet => Boolean(wallet)));
                })()
            );
        }
        // We don't want to include `withLoadingDecryption` because it is unstable between rerenders
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [encryptedWallets, userKeys]);

    return [decryptedWallets, loading || loadingDecryption] as const;
};
