import { useMemo } from 'react';

import type { IWasmApiWalletData } from '@proton/wallet';

import { useBitcoinBlockchainContext } from '../contexts';

/**
 * Hook to determine if a wallet needs a passphrase and if the fingerprint is wrong.
 *
 * @param {IWasmApiWalletData} wallet - The wallet data.
 * @returns {[boolean, boolean]} - An array containing two booleans. The first boolean indicates if a passphrase is needed,
 *                                  and the second boolean indicates if the fingerprint is wrong.
 */
export const useWalletPassphrase = (wallet?: IWasmApiWalletData) => {
    const { walletsChainData } = useBitcoinBlockchainContext();

    const needPassphrase = Boolean(wallet?.Wallet.HasPassphrase && !wallet?.Wallet.Passphrase);
    const wrongFingerprint = Boolean(
        needPassphrase &&
            wallet?.Wallet.ID &&
            wallet?.Wallet.Fingerprint !== walletsChainData[wallet.Wallet.ID]?.wallet.getFingerprint()
    );

    const canUseWallet = !needPassphrase && !wrongFingerprint;

    return useMemo(
        () => ({
            needPassphrase,
            wrongFingerprint,
            canUseWallet,
        }),
        [canUseWallet, needPassphrase, wrongFingerprint]
    );
};
