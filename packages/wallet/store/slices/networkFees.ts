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
    recommendedFees: {
        HighPriority: number;
        MedianPriority: number;
        LowPriority: number;
    };
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
    recommendedFees: {
        HighPriority: 1,
        MedianPriority: 1,
        LowPriority: 1,
    },
};
const initialState = getInitialModelState<Model>(DEFAULT_FEE_SETTINGS);

const feesMapToList = (feesMap: Map<string, number>) => {
    return (
        [...feesMap.entries()]
            // We need to round feeRate because bdk expects a BigInt
            .map(([block, feeRate]): FeeRateByBlockTarget => [Number(block), Math.ceil(feeRate)])
            .filter(([block]) => Number.isFinite(block))
            .sort(([a], [b]) => a - b)
    );
};

const modelThunk = createAsyncModelThunk<Model, NetworkFeesState, WalletThunkArguments>(`${name}/fetch`, {
    miss: async ({ extraArgument }) => {
        const blockchainClient = new WasmBlockchainClient(extraArgument.walletApi);

        const feesMap = await blockchainClient.getFeesEstimation();
        const { MinimumBroadcastFee: minimumBroadcastFee, MinimumIncrementalFee: minimumIncrementalFee } =
            await blockchainClient.getMininumFees();

        const feesList = feesMapToList(feesMap);

        const recommendedFees = await blockchainClient
            .getRecommendedFees()
            .then((recommendedFees) => {
                return {
                    HighPriority: recommendedFees.FastestFee,
                    MedianPriority: recommendedFees.HalfHourFee,
                    LowPriority: recommendedFees.HourFee,
                };
            })
            .catch(() => {
                return {
                    HighPriority: 1,
                    MedianPriority: 1,
                    LowPriority: 1,
                };
            });

        return { feesMap, feesList, minimumBroadcastFee, minimumIncrementalFee, recommendedFees };
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
