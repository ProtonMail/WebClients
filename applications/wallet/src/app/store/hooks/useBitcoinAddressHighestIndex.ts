import { useCallback, useMemo } from 'react';

import { createHooks } from '@proton/redux-utilities';

import { bitcoinAddressHighestIndexThunk, selectBitcoinAddressHighestIndex } from '../slices';

const hooks = createHooks(bitcoinAddressHighestIndexThunk, selectBitcoinAddressHighestIndex);

export const useBitcoinAddressHighestIndex = (walletAccountId: string) => {
    const [value, loading] = hooks.useValue();

    return useMemo(() => {
        return [value?.[walletAccountId]?.index, loading];
    }, [loading, value, walletAccountId]);
};
export const useGetBitcoinAddressHighestIndex = () => {
    const get = hooks.useGet();
    return useCallback(
        async (walletId: string, walletAccountId: string) => {
            const results = await get({ thunkArg: [walletId, walletAccountId] });
            return results[walletAccountId]?.index ?? 0;
        },
        [get]
    );
};
