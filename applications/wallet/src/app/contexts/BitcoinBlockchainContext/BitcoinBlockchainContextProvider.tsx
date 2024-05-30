import { ReactNode, useContext, useState } from 'react';

import { useDecryptedApiWalletsData } from '@proton/wallet';

import { BitcoinBlockchainContext } from '.';
import { useBitcoinAddressPool } from '../../hooks/useBitcoinAddressPool';
import { useBitcoinNetwork } from '../../store/hooks';
import { useDebounceEffect } from '../../utils/hooks/useDebouncedEffect';
import { useBlockchainFeesEstimation } from './useBlockchainFeesEstimation';
import { useWalletsChainData } from './useWalletsChainData';

interface Props {
    children: ReactNode;
}

export const BitcoinBlockchainContextProvider = ({ children }: Props) => {
    const [key, setKey] = useState(0);
    const [network] = useBitcoinNetwork();
    const {
        decryptedApiWalletsData,
        walletMap,
        loading: loadingApiWalletsData,
        setPassphrase,
    } = useDecryptedApiWalletsData();

    const onSyncingFinished = () => {
        setKey((prev) => prev + 1);
    };

    const {
        walletsChainData,
        accountIDByDerivationPathByWalletID,
        syncingMetatadaByAccountId,
        syncManyWallets,
        syncSingleWallet,
        syncSingleWalletAccount,
        isSyncing,
        getSyncingData,
    } = useWalletsChainData(decryptedApiWalletsData, onSyncingFinished);

    const { feesEstimation, loading: loadingFeesEstimation } = useBlockchainFeesEstimation();

    const { fillPool } = useBitcoinAddressPool({ decryptedApiWalletsData, walletsChainData });

    useDebounceEffect(
        () => {
            void fillPool();
        },
        [fillPool],
        3000
    );

    return (
        <BitcoinBlockchainContext.Provider
            key={key}
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

                isSyncing,
                getSyncingData,

                feesEstimation,
                loadingFeesEstimation,
            }}
        >
            {children}
        </BitcoinBlockchainContext.Provider>
    );
};

export const useBitcoinBlockchainContext = () => useContext(BitcoinBlockchainContext);
