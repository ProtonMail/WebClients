import { useEffect, useState } from 'react';

import type { WasmApiWalletAccount } from '@proton/andromeda';
import type { IWasmApiWalletData } from '@proton/wallet';

import { useBitcoinBlockchainContext } from '../../contexts';
import type { WalletChainDataByWalletId } from '../../types';
import { getAccountBalance, getAccountWithChainDataFromManyWallets, getWalletBalance } from '../../utils';

const getBalanceData = async (
    walletsChainData: WalletChainDataByWalletId,
    apiData: IWasmApiWalletData,
    apiAccount?: WasmApiWalletAccount
): Promise<[number, number]> => {
    if (apiAccount) {
        const accountChainData = getAccountWithChainDataFromManyWallets(
            walletsChainData,
            apiData.Wallet.ID,
            apiAccount.ID
        );

        return [await getAccountBalance(accountChainData), 1];
    }

    return [await getWalletBalance(walletsChainData, apiData.Wallet.ID), apiData?.WalletAccounts.length ?? 0];
};

/**
 * Returns balance overview either for Single wallet dashboard or Many wallets ones
 */
export const useBalance = (apiData: IWasmApiWalletData, apiAccount?: WasmApiWalletAccount) => {
    const { walletsChainData } = useBitcoinBlockchainContext();

    const [[balance, dataCount], setData] = useState<Awaited<ReturnType<typeof getBalanceData>>>([0, 0]);

    useEffect(() => {
        void getBalanceData(walletsChainData, apiData, apiAccount).then((d) => {
            setData(d);
        });
    }, [walletsChainData, apiData, apiAccount]);

    return {
        balance,
        dataCount,
    };
};
