import { useCallback, useEffect } from 'react';

import { createSelector } from '@reduxjs/toolkit';

import type { WasmApiWalletBitcoinAddress } from '@proton/andromeda';
import { baseUseSelector } from '@proton/react-redux-store';
import { createHooks  } from '@proton/redux-utilities/hooks';
import { CacheType } from '@proton/redux-utilities/interface';

import { bitcoinAddressPoolThunk, selectBitcoinAddressPool } from '../slices';

const hooks = createHooks(bitcoinAddressPoolThunk, selectBitcoinAddressPool);

export const useGetBitcoinAddressPool = () => {
    const get = hooks.useGet();

    return useCallback(
        async (walletId: string, walletAccountId: string) => {
            const results = await get({ thunkArg: [walletId, walletAccountId], cache: CacheType.None });
            return results[walletAccountId] ?? [];
        },
        [get]
    );
};

export const useBitcoinAddressPool = (walletId: string, walletAccountId: string) => {
    const getBitcoinAddressPool = useGetBitcoinAddressPool();
    const [, loading] = hooks.useValue();

    const bitcoinAddressPoolSelector = createSelector(
        selectBitcoinAddressPool,
        (result): [WasmApiWalletBitcoinAddress[] | undefined, boolean] => {
            const { value } = result;

            const addresses = value?.[walletAccountId];

            return [addresses, loading];
        }
    );

    useEffect(() => {
        void getBitcoinAddressPool(walletId, walletAccountId);
    }, [walletId, walletAccountId]);

    return baseUseSelector(bitcoinAddressPoolSelector);
};
