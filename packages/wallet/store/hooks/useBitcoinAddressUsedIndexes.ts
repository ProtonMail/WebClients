import { useCallback } from 'react';

import { CacheType, createHooks } from '@proton/redux-utilities';

import { bitcoinAddressUsedIndexesThunk, selectBitcoinAddressUsedIndexes } from '../slices';

const hooks = createHooks(bitcoinAddressUsedIndexesThunk, selectBitcoinAddressUsedIndexes);

export const useGetBitcoinAddressUsedIndexes = () => {
    const get = hooks.useGet();
    return useCallback(
        async (walletId: string, walletAccountId: string) => {
            const results = await get({ thunkArg: [walletId, walletAccountId], cache: CacheType.None });
            return results[walletAccountId] ?? [];
        },
        [get]
    );
};
