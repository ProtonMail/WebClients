import { useCallback } from 'react';

import { createHooks } from '@proton/redux-utilities';

import { apiWalletTransactionDataThunk, selectApiWalletTransactionData } from '../slices';

const hooks = createHooks(apiWalletTransactionDataThunk, selectApiWalletTransactionData);

export const useApiWalletTransactionData = hooks.useValue;
export const useGetApiWalletTransactionData = () => {
    const get = hooks.useGet();
    return useCallback(
        async (walletId: string, walletAccountId?: string, hashedTxids?: string[]) => {
            const results = await get({ thunkArg: [walletId, walletAccountId, hashedTxids] });
            return results.filter(({ Data }) => (hashedTxids ?? []).includes(Data.HashedTransactionID ?? ''));
        },
        [get]
    );
};
