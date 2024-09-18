import { useCallback, useEffect } from 'react';

import { createSelector } from '@reduxjs/toolkit';

import usePrevious from '@proton/hooks/usePrevious';
import { baseUseSelector } from '@proton/react-redux-store';
import { createHooks } from '@proton/redux-utilities';
import isEqual from '@proton/shared/lib/helpers/isDeepEqual';
import { pick } from '@proton/shared/lib/helpers/object';

import { apiWalletTransactionDataThunk, selectApiWalletTransactionData } from '../slices';
import { type WalletTransactionsThunkArg, type WalletTransactionByHashedTxId } from '../slices/apiWalletTransactionData';

const hooks = createHooks(apiWalletTransactionDataThunk, selectApiWalletTransactionData);

export const useGetApiWalletTransactionData = () => {
    const get = hooks.useGet();
    return useCallback(
        async (args: WalletTransactionsThunkArg) => {
            const results = await get({ thunkArg: [args] });
            return pick(results, Object.keys(args.networkTransactionByHashedTxId));
        },
        [get]
    );
};

export const useApiWalletTransactionData = (args: WalletTransactionsThunkArg) => {
    const getApiWalletTransactionData = useGetApiWalletTransactionData();
    const [, loading] = hooks.useValue();

    const ApiWalletTransactionDataSimpleSelector = createSelector(
        selectApiWalletTransactionData,
        (result): [WalletTransactionByHashedTxId | undefined, boolean] => {
            const { value } = result;
            return [value && pick(value, Object.keys(args.networkTransactionByHashedTxId)), loading];
        }
    );

    const previousArgs = usePrevious(args);

    useEffect(() => {
        if (!isEqual(args, previousArgs)) {
            void getApiWalletTransactionData(args);
        }
    }, [args, getApiWalletTransactionData, previousArgs]);

    return baseUseSelector(ApiWalletTransactionDataSimpleSelector);
};
