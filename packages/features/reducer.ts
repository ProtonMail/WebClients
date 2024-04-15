import { PayloadAction, createSlice } from '@reduxjs/toolkit';
import { ThunkAction } from 'redux-thunk';

import { getFeatures, updateFeatureValue } from '@proton/shared/lib/api/features';
import { getSilentApi } from '@proton/shared/lib/api/helpers/customConfig';
import { HOUR } from '@proton/shared/lib/constants';
import type { Api } from '@proton/shared/lib/interfaces';

import type { Feature, FeatureCode } from './interface';

interface FeatureState {
    value: Feature;
    meta: { fetchedAt: number };
}

type FeaturesState = { [key in FeatureCode]?: FeatureState };

const codePromiseCache: { [key in FeatureCode]?: Promise<FeatureState> } = {};

export interface FeaturesReducerState {
    features: FeaturesState;
}

export const selectFeatures = (state: FeaturesReducerState) => state.features;

export interface ThunkArguments {
    api: Api;
}

const initialState = {} as FeaturesState;

export const featuresReducer = createSlice({
    name: 'features',
    initialState,
    reducers: {
        'fetch/fulfilled': (state, action: PayloadAction<{ codes: FeatureCode[]; features: FeaturesState }>) => {
            return {
                ...state,
                ...action.payload.features,
            };
        },
        'update/pending': (state, action: PayloadAction<{ code: FeatureCode; featureValue: any }>) => {
            const old = state[action.payload.code];
            if (old) {
                state[action.payload.code] = {
                    ...old,
                    value: {
                        ...old.value,
                        Value: action.payload.featureValue,
                    },
                };
            }
        },
        'update/fulfilled': (state, action: PayloadAction<{ code: FeatureCode; feature: FeatureState }>) => {
            const old = state[action.payload.code];
            state[action.payload.code] = {
                value: {
                    ...old?.value,
                    ...action.payload.feature.value,
                },
                meta: action.payload.feature.meta,
            };
        },
        'update/rejected': (state, action: PayloadAction<{ code: FeatureCode; feature: FeatureState | undefined }>) => {
            state[action.payload.code] = action.payload.feature;
        },
    },
});

export const isValidFeature = (featureState: FeatureState | undefined): featureState is FeatureState => {
    if (featureState?.value !== undefined && Date.now() - featureState.meta.fetchedAt < HOUR * 2) {
        return true;
    }
    return false;
};

type ThunkResult<Key extends FeatureCode> = { [key in Key]: Feature };

export const fetchFeatures = <T extends FeatureCode>(
    codes: T[]
): ThunkAction<
    Promise<ThunkResult<T>>,
    FeaturesReducerState,
    ThunkArguments,
    ReturnType<(typeof featuresReducer.actions)['fetch/fulfilled']>
> => {
    return async (dispatch, getState, extraArgument) => {
        const featuresState = selectFeatures(getState());

        if (codes.length === 1) {
            const code = codes[0];
            const promise = codePromiseCache[code];
            if (promise) {
                const result = await promise;
                return { [code]: result.value } as ThunkResult<T>;
            }
            const featureState = featuresState[code];
            if (isValidFeature(featureState)) {
                return { [code]: featureState.value } as ThunkResult<T>;
            }
        }

        const codesToFetch = codes.filter((code) => {
            if (codePromiseCache[code]) {
                return false;
            }
            return !isValidFeature(featuresState[code]);
        });

        if (codesToFetch.length) {
            const promise = getSilentApi(extraArgument.api)<{
                Features: Feature[];
            }>(getFeatures(codesToFetch)).then(({ Features }) => {
                const result = Features.reduce<FeaturesState>(
                    (acc, Feature) => {
                        acc[Feature.Code as FeatureCode] = { value: Feature, meta: { fetchedAt: Date.now() } };
                        return acc;
                    },
                    codesToFetch.reduce<FeaturesState>((acc, code) => {
                        acc[code] = { value: {} as Feature, meta: { fetchedAt: Date.now() } };
                        return acc;
                    }, {})
                );
                dispatch(featuresReducer.actions['fetch/fulfilled']({ codes: codesToFetch, features: result }));
                return result;
            });

            codesToFetch.forEach((code) => {
                codePromiseCache[code] = promise
                    .then((result) => {
                        return result[code]!;
                    })
                    .finally(() => {
                        codePromiseCache[code] = undefined;
                    });
            });
        }

        const features = await Promise.all(
            codes.map(async (code): Promise<[FeatureCode, Feature]> => {
                return [code, (((await codePromiseCache[code]) || featuresState[code])?.value || {}) as Feature];
            })
        );
        return Object.fromEntries(features) as ThunkResult<T>;
    };
};

export const updateFeature = (
    code: FeatureCode,
    value: any
): ThunkAction<
    Promise<Feature>,
    FeaturesReducerState,
    ThunkArguments,
    | ReturnType<(typeof featuresReducer.actions)['update/pending']>
    | ReturnType<(typeof featuresReducer.actions)['update/fulfilled']>
    | ReturnType<(typeof featuresReducer.actions)['update/rejected']>
> => {
    return async (dispatch, getState, extraArgument) => {
        const current = selectFeatures(getState())[code];
        try {
            dispatch(
                featuresReducer.actions['update/pending']({
                    code,
                    featureValue: value,
                })
            );
            const { Feature } = await getSilentApi(extraArgument.api)<{
                Feature: Feature;
            }>(updateFeatureValue(code, value));
            dispatch(
                featuresReducer.actions['update/fulfilled']({
                    code,
                    feature: { value: Feature, meta: { fetchedAt: Date.now() } },
                })
            );
            return value;
        } catch (error) {
            dispatch(featuresReducer.actions['update/rejected']({ code, feature: current }));
            throw error;
        }
    };
};
