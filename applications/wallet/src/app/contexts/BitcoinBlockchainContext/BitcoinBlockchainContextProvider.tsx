import type { ReactNode } from 'react';
import { useContext, useMemo } from 'react';

import { buildMapFromWallets } from '@proton/wallet';
import { useApiWalletsData, useBitcoinNetwork } from '@proton/wallet/store';

import { BitcoinBlockchainContext } from '.';
import { type WalletMap } from '../../types';
import { useBitcoinAddresses } from './useBitcoinAddresses';
import { useWalletsChainData } from './useWalletsChainData';

interface Props {
    children: ReactNode;
}

export const BitcoinBlockchainContextProvider = ({ children }: Props) => {
    const [network] = useBitcoinNetwork();

    const [apiWalletsData, loadingApiWalletsData] = useApiWalletsData();

    const walletMap: WalletMap = useMemo(() => {
        return buildMapFromWallets(apiWalletsData);
    }, [apiWalletsData]);

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
    } = useWalletsChainData(apiWalletsData);

    const { manageBitcoinAddressPool, bitcoinAddressHelperByWalletAccountId } = useBitcoinAddresses({
        apiWalletsData,
        walletsChainData,
        isSyncing,
        network,
    });

    return (
        <BitcoinBlockchainContext.Provider
            value={{
                network,

                apiWalletsData,
                walletMap,
                loadingApiWalletsData,

                walletsChainData,
                accountIDByDerivationPathByWalletID,
                syncingMetatadaByAccountId,
                syncManyWallets,
                syncSingleWallet,
                syncSingleWalletAccount,
                incrementSyncKey,

                isSyncing,
                getSyncingData,

                manageBitcoinAddressPool,
                bitcoinAddressHelperByWalletAccountId,
            }}
        >
            {children}
        </BitcoinBlockchainContext.Provider>
    );
};

export const useBitcoinBlockchainContext = () => useContext(BitcoinBlockchainContext);
