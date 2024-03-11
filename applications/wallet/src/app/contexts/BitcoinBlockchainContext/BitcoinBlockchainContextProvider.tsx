import { ReactNode, useContext } from 'react';

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
    const { decryptedApiWalletsData, loading: loadingApiWalletsData, setPassphrase } = useDecryptedApiWalletsData();

    const { walletsChainData, syncingMetatadaByAccountId, syncManyWallets, syncSingleWallet, syncSingleWalletAccount } =
        useWalletsChainData(decryptedApiWalletsData);

    const { feesEstimation, loading: loadingFeesEstimation } = useBlockchainFeesEstimation();

    return (
        <BitcoinBlockchainContext.Provider
            value={{
                network,

                decryptedApiWalletsData,
                loadingApiWalletsData,
                setPassphrase,

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
