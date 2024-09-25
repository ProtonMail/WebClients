import { useCallback, useEffect } from 'react';

import { createSelector } from '@reduxjs/toolkit';

import usePrevious from '@proton/hooks/usePrevious';
import { baseUseSelector } from '@proton/react-redux-store';
import { createHooks } from '@proton/redux-utilities';
import isEqual from '@proton/shared/lib/helpers/isDeepEqual';
import { pick } from '@proton/shared/lib/helpers/object';

import { apiWalletTransactionDataThunk, selectApiWalletTransactionData } from '../slices';
import {
    type WalletTransactionByHashedTxId,
    type WalletTransactionsThunkArg,
} from '../slices/apiWalletTransactionData';

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

/**
 * This hook retrieves and selects wallet transaction data based on the provided arguments.
 * It can accept either a WalletTransactionsThunkArg object or an array of string representing hashed transaction IDs.
 *
 * If an object is provided, it will fetch the transaction data for the specified networkTransactionByHashedTxId.
 * If an array is provided, it will only return (without fetching) data found inside the store
 *
 * The hook returns an array containing the selected transaction data and a boolean indicating if the data is loading.
 *
 * It also handles refetching the data if the arguments change.
 */
export const useApiWalletTransactionData = (args: WalletTransactionsThunkArg | string[]) => {
    const getApiWalletTransactionData = useGetApiWalletTransactionData();

    const apiWalletTransactionDataSimpleSelector = createSelector(
        selectApiWalletTransactionData,
        (result): [WalletTransactionByHashedTxId | undefined, boolean] => {
            const { value } = result;
            const hashedTxIdToPick = Array.isArray(args) ? args : Object.keys(args.networkTransactionByHashedTxId);

            if (!value) {
                return [{}, true];
            }

            const pickedItems = pick(value, hashedTxIdToPick);
            const isLoading = Object.values(pickedItems).filter(Boolean).length !== hashedTxIdToPick.length;

            return [pickedItems, isLoading];
        }
    );

    const previousArgs = usePrevious(args);

    useEffect(() => {
        if (!isEqual(args, previousArgs) && !Array.isArray(args)) {
            void getApiWalletTransactionData(args);
        }
    }, [args, getApiWalletTransactionData, previousArgs]);

    return baseUseSelector(apiWalletTransactionDataSimpleSelector);
};
