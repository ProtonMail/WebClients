import { useCallback } from 'react';

import { WasmApiWalletAccount } from '@proton/andromeda';

import { useGetBitcoinAddressHighestIndex } from '../../store/hooks/useBitcoinAddressHighestIndex';
import { WalletChainDataByWalletId } from '../../types';
import { getAccountWithChainDataFromManyWallets } from '../accounts';

export const useComputeNextAddressToReceive = (walletsChainData: WalletChainDataByWalletId) => {
    const getBitcoinAddressHighestIndex = useGetBitcoinAddressHighestIndex();

    return useCallback(
        async (account: WasmApiWalletAccount) => {
            const wasmAccount = getAccountWithChainDataFromManyWallets(walletsChainData, account.WalletID, account.ID);

            const apiHighestIndex = await getBitcoinAddressHighestIndex(account.WalletID, account.ID);
            const clientHighestIndex = await wasmAccount?.account.getLastUnusedAddressIndex();

            return Math.max(clientHighestIndex ?? 0, apiHighestIndex) + 1;
        },
        [getBitcoinAddressHighestIndex, walletsChainData]
    );
};
