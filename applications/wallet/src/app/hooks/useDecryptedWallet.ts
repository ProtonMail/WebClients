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
                            const [decryptedMnemonic, decryptedPublickey] = await decryptWalletData(
                                [walletData.Wallet.Mnemonic, walletData.Wallet.PublicKey],
                                walletData.WalletKey.WalletKey,
                                userKeys
                            );

                            const clonedWallet = { ...walletData.Wallet };
                            clonedWallet.Mnemonic = decryptedMnemonic ?? null;
                            clonedWallet.PublicKey = decryptedPublickey ?? null;

                            return {
                                Wallet: clonedWallet,
                                WalletKey: walletData.WalletKey,
                                WalletSettings: walletData.WalletSettings,
                            };
                        })
                    );

                    setDecryptedWallets(wallets);
                })()
            );
        }
    }, [encryptedWallets, userKeys]);

    return [decryptedWallets, loading || loadingDecryption] as const;
};
