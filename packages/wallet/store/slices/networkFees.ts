import { createSlice } from '@reduxjs/toolkit';

import { type ModelState, getInitialModelState } from '@proton/account';
import { WasmBlockchainClient } from '@proton/andromeda';
import { createAsyncModelThunk, handleAsyncModel, previousSelector } from '@proton/redux-utilities';

import type { WalletThunkArguments } from '../thunk';

const name = 'network_fees' as const;

type BlockTarget = number;
type FeeRate = number;

export type FeeRateByBlockTarget = [BlockTarget, FeeRate];

export interface FeeSettings {
    feesMap: Map<string, number>;
    feesList: FeeRateByBlockTarget[];
    minimumBroadcastFee: number;
    minimumIncrementalFee: number;
}

export interface NetworkFeesState {
    [name]: ModelState<FeeSettings>;
}

type SliceState = NetworkFeesState[typeof name];
type Model = NonNullable<SliceState['value']>;

export const selectNetworkFees = (state: NetworkFeesState) => state[name];

export const DEFAULT_FEE_SETTINGS = {
    feesMap: new Map(),
    feesList: [],
    minimumBroadcastFee: 1.0,
    minimumIncrementalFee: 1.0,
};
const initialState = getInitialModelState<Model>(DEFAULT_FEE_SETTINGS);

const feesMapToList = (feesMap: Map<string, number>) => {
    return (
        [...feesMap.entries()]
            // We need to round feeRate because bdk expects a BigInt
            .map(([block, feeRate]): FeeRateByBlockTarget => [Number(block), Math.round(feeRate)])
            .filter(([block]) => Number.isFinite(block))
            .sort(([a], [b]) => a - b)
    );
};

const modelThunk = createAsyncModelThunk<Model, NetworkFeesState, WalletThunkArguments>(`${name}/fetch`, {
    miss: async ({ extraArgument }) => {
        const isMinFeeEnabled = await extraArgument.unleashClient.isEnabled('WalletMinFee');

        const blockchainClient = new WasmBlockchainClient(extraArgument.walletApi);

        const feesMap = await blockchainClient.getFeesEstimation();
        const { MinimumBroadcastFee: minimumBroadcastFee, MinimumIncrementalFee: minimumIncrementalFee } =
            isMinFeeEnabled
                ? await blockchainClient.getMininumFees()
                : { MinimumBroadcastFee: 1.0, MinimumIncrementalFee: 1.0 };

        const feesList = feesMapToList(feesMap);

        return { feesMap, feesList, minimumBroadcastFee, minimumIncrementalFee };
    },
    previous: previousSelector(selectNetworkFees),
});

const slice = createSlice({
    name,
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        handleAsyncModel(builder, modelThunk);
    },
});

export const networkFeesReducer = { [name]: slice.reducer };
export const networkFeesThunk = modelThunk.thunk;
