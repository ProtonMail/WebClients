import { ReactNode, useContext, useMemo } from 'react';

import { isEmpty } from 'lodash';

import { BitcoinBlockchainContext } from '.';
import { useBitcoinNetwork } from '../../store/hooks';
import { useBlockchainFeesEstimation } from './useBlockchainFeesEstimation';
import { useDecryptedApiWalletsData } from './useDecryptedApiWalletsData';
import { useWalletsChainData } from './useWalletsChainData';

interface Props {
    children: ReactNode;
}

export const BitcoinBlockchainContextProvider = ({ children }: Props) => {
    const [network] = useBitcoinNetwork();
    const { decryptedApiWalletsData, setPassphrase } = useDecryptedApiWalletsData();

    const { walletsChainData, syncingMetatadaByAccountId, syncManyWallets, syncSingleWallet, syncSingleWalletAccount } =
        useWalletsChainData(decryptedApiWalletsData);

    const { feesEstimation, loading: loadingFeesEstimation } = useBlockchainFeesEstimation();

    const isInitialised = useMemo(() => {
        return !isEmpty(walletsChainData);
    }, [walletsChainData]);

    return (
        <BitcoinBlockchainContext.Provider
            value={{
                network,

                decryptedApiWalletsData,
                setPassphrase,

                isInitialised,
                walletsChainData,
                syncingMetatadaByAccountId,
                syncManyWallets,
                syncSingleWallet,
                syncSingleWalletAccount,

                feesEstimation,
                loadingFeesEstimation,
            }}
        >
            {children}
        </BitcoinBlockchainContext.Provider>
    );
};

export const useBitcoinBlockchainContext = () => useContext(BitcoinBlockchainContext);
