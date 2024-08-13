import type { ReactNode } from 'react';
import { useContext } from 'react';

import { useBitcoinNetwork, useDecryptedApiWalletsData } from '@proton/wallet';

import { BitcoinBlockchainContext } from '.';
import { useBitcoinAddresses } from './useBitcoinAddresses';
import { useBlockchainFeesEstimation } from './useBlockchainFeesEstimation';
import { useWalletsChainData } from './useWalletsChainData';

interface Props {
    children: ReactNode;
}

export const BitcoinBlockchainContextProvider = ({ children }: Props) => {
    const [network] = useBitcoinNetwork();
    const {
        decryptedApiWalletsData,
        walletMap,
        loading: loadingApiWalletsData,
        setPassphrase,
    } = useDecryptedApiWalletsData();

    const {
        walletsChainData,
        accountIDByDerivationPathByWalletID,
        syncingMetatadaByAccountId,
        syncManyWallets,
        syncSingleWallet,
        syncSingleWalletAccount,
        incrementSyncKey,
        isSyncing,
        getSyncingData,
    } = useWalletsChainData(decryptedApiWalletsData);

    const { feesEstimation, loading: loadingFeesEstimation } = useBlockchainFeesEstimation();

    const { manageBitcoinAddressPool, bitcoinAddressHelperByWalletAccountId } = useBitcoinAddresses({
        decryptedApiWalletsData,
        walletsChainData,
        isSyncing,
    });

    return (
        <BitcoinBlockchainContext.Provider
            value={{
                network,

                decryptedApiWalletsData,
                walletMap,
                loadingApiWalletsData,
                setPassphrase,

                walletsChainData,
                accountIDByDerivationPathByWalletID,
                syncingMetatadaByAccountId,
                syncManyWallets,
                syncSingleWallet,
                syncSingleWalletAccount,
                incrementSyncKey,

                isSyncing,
                getSyncingData,

                feesEstimation,
                loadingFeesEstimation,

                manageBitcoinAddressPool,
                bitcoinAddressHelperByWalletAccountId,
            }}
        >
            {children}
        </BitcoinBlockchainContext.Provider>
    );
};

export const useBitcoinBlockchainContext = () => useContext(BitcoinBlockchainContext);
