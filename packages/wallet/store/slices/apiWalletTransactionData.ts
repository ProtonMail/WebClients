import { createAction, createSlice } from '@reduxjs/toolkit';
import pick from 'lodash/pick';
import set from 'lodash/set';

import type { AddressKeysState, ModelState, UserKeysState } from '@proton/account';
import { dispatchGetAllAddressesKeys, getInitialModelState, userKeysThunk } from '@proton/account';
import { createAsyncModelThunk, handleAsyncModel } from '@proton/redux-utilities';
import { toMap } from '@proton/shared/lib/helpers/object';
import { type SimpleMap } from '@proton/shared/lib/interfaces';
import isTruthy from '@proton/utils/isTruthy';
import {
    type AccountIdByDerivationPathAndWalletId,
    type DecryptedTransactionData,
    type NetworkTransactionByHashedTxId,
    createApiTransactions,
    fetchApiTransactions,
    hashApiTransactions,
} from '@proton/wallet';

import type { WalletThunkArguments } from '../thunk';

export const apiWalletTransactionDataSliceName = 'api_wallet_transaction_data' as const;

export type WalletTransactionByHashedTxId = SimpleMap<DecryptedTransactionData>;

export interface ApiWalletTransactionDataState extends UserKeysState, AddressKeysState {
    [apiWalletTransactionDataSliceName]: ModelState<WalletTransactionByHashedTxId>;
}

type SliceState = ApiWalletTransactionDataState[typeof apiWalletTransactionDataSliceName];
type Model = NonNullable<SliceState['value']>;

export const selectApiWalletTransactionData = (state: ApiWalletTransactionDataState) =>
    state[apiWalletTransactionDataSliceName];

export interface WalletTransactionsThunkArg {
    walletId: string;
    walletKey: CryptoKey | undefined;
    walletHmacKey: CryptoKey | undefined;
    networkTransactionByHashedTxId: NetworkTransactionByHashedTxId;
    accountIDByDerivationPathByWalletID: AccountIdByDerivationPathAndWalletId;
}

const modelThunk = createAsyncModelThunk<Model, ApiWalletTransactionDataState, WalletThunkArguments, [WalletTransactionsThunkArg]>(
    `${apiWalletTransactionDataSliceName}/fetch`,
    {
        miss: async ({ extraArgument, options, getState, dispatch }) => {
            if (!options?.thunkArg) {
                return Promise.resolve({});
            }

            const userKeys = await dispatch(userKeysThunk());
            const addressKeys = await dispatchGetAllAddressesKeys(dispatch);

            const [
                {
                    walletId,
                    walletHmacKey,
                    walletKey,
                    networkTransactionByHashedTxId,
                    accountIDByDerivationPathByWalletID,
                },
            ] = options.thunkArg;

            const hashedTxIds = Object.keys(networkTransactionByHashedTxId);
            const state = getState()[apiWalletTransactionDataSliceName];

            if (!walletHmacKey || !walletKey || !hashedTxIds.length) {
                return state;
            }

            let updatedState = { ...state.value };
            let notFoundHashedTxIds = hashedTxIds?.filter((hashedTxId) => !updatedState[hashedTxId]);

            const fetchedTransactions = await fetchApiTransactions({
                api: extraArgument.walletApi.clients(),
                hashedTxids: notFoundHashedTxIds,
                walletId,
                walletKey,
                userPrivateKeys: userKeys.map((k) => k.privateKey),
                addressesPrivateKeys: addressKeys.map((k) => k.privateKey),
            });

            updatedState = {
                ...updatedState,
                ...toMap(fetchedTransactions, 'HashedTransactionID'),
            };

            notFoundHashedTxIds = notFoundHashedTxIds?.filter((hashedTxId) => !updatedState[hashedTxId]);
            if (!!notFoundHashedTxIds?.length) {
                const hashedTransactions = await hashApiTransactions({
                    api: extraArgument.walletApi.clients(),
                    walletId,
                    walletKey,
                    hmacKey: walletHmacKey,
                    userPrivateKeys: userKeys.map((k) => k.privateKey),
                    addressesPrivateKeys: addressKeys.map((k) => k.privateKey),
                    checkShouldAbort: () => false, // TODO check
                });

                updatedState = {
                    ...updatedState,
                    ...toMap(hashedTransactions, 'HashedTransactionID'),
                };
            }

            notFoundHashedTxIds = notFoundHashedTxIds?.filter((hashedTxId) => !updatedState[hashedTxId]);
            const transactionsWithoutApiData = notFoundHashedTxIds
                .map((hashedTxId) => networkTransactionByHashedTxId[hashedTxId])
                .filter(isTruthy);

            const createdTransactions = await createApiTransactions({
                api: extraArgument.walletApi.clients(),
                walletId,
                walletKey,
                userKeys,
                checkShouldAbort: () => false, // TODO check
                accountIDByDerivationPathByWalletID,
                transactionsWithoutApiData,
            });

            updatedState = {
                ...updatedState,
                ...toMap(createdTransactions, 'HashedTransactionID'),
            };

            notFoundHashedTxIds = notFoundHashedTxIds?.filter((hashedTxId) => !updatedState[hashedTxId]);

            if (!!notFoundHashedTxIds?.length) {
                console.warn("Some transactions weren't find", notFoundHashedTxIds);
            }

            // We return the whole update state, then requested network transaction needs to be picked from it
            return updatedState;
        },
        previous: ({ options, getState }) => {
            const state = getState()[apiWalletTransactionDataSliceName];

            if (!options?.thunkArg) {
                return undefined;
            }

            const [{ networkTransactionByHashedTxId }] = options.thunkArg;
            const hashedTxIds = Object.keys(networkTransactionByHashedTxId);

            const stateValue = state.value;
            const hashedTxIdToFetch = hashedTxIds.filter((hashedTxId) => !stateValue?.[hashedTxId]);

            // If some hashedTxId are not in the store yet, we return undefined, else we pick the provided hashedTxIds from the store
            return hashedTxIdToFetch.length ? undefined : { ...state, value: pick(stateValue, hashedTxIds) };
        },
    }
);

const initialState = getInitialModelState<Model>();

export const updateWalletTransaction = createAction(
    'wallet-transaction/update',
    (payload: { hashedTransactionId: string; update: Partial<DecryptedTransactionData> }) => ({ payload })
);

const slice = createSlice({
    name: apiWalletTransactionDataSliceName,
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        handleAsyncModel(builder, modelThunk);
        builder.addCase(updateWalletTransaction, (state, action) => {
            const transaction = state.value?.[action.payload.hashedTransactionId];

            if (state.value && transaction) {
                set(state.value, action.payload.hashedTransactionId, {
                    ...transaction,
                    ...action.payload.update,
                });
            }
        });
    },
});

export const apiWalletTransactionDataReducer = { [apiWalletTransactionDataSliceName]: slice.reducer };
export const apiWalletTransactionDataThunk = modelThunk.thunk;
