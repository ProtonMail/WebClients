import { useCallback } from 'react';

import { CacheType, createHooks } from '@proton/redux-utilities';

import { bitcoinAddressHighestIndexThunk, selectBitcoinAddressHighestIndex } from '../slices';

const hooks = createHooks(bitcoinAddressHighestIndexThunk, selectBitcoinAddressHighestIndex);

// FIXME: We don't expose useValue hook on purpose because it doesn't support well maps
//
// export const useBitcoinAddressHighestIndex = (walletAccountId: string) => {
//     const [value, loading] = hooks.useValue();

//     return useMemo(() => {
//         return [value?.[walletAccountId]?.index, loading];
//     }, [loading, value, walletAccountId]);
// };

export const useGetBitcoinAddressHighestIndex = () => {
    const get = hooks.useGet();
    return useCallback(
        async (walletId: string, walletAccountId: string) => {
            const results = await get({ thunkArg: [walletId, walletAccountId], cache: CacheType.None });
            return results[walletAccountId]?.index ?? 0;
        },
        [get]
    );
};
