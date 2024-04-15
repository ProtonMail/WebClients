import { PayloadAction, createSlice } from '@reduxjs/toolkit';
import { ThunkAction } from 'redux-thunk';

import { getFeatures, updateFeatureValue } from '@proton/shared/lib/api/features';
import { getSilentApi } from '@proton/shared/lib/api/helpers/customConfig';
import { HOUR } from '@proton/shared/lib/constants';
import { getMinuteJitter } from '@proton/shared/lib/helpers/jitter';
import type { Api } from '@proton/shared/lib/interfaces';
import unique from '@proton/utils/unique';

import type { Feature, FeatureCode } from './interface';

interface FeatureState {
    value: Feature;
    meta: { fetchedAt: number };
}

type FeaturesState = { [key in FeatureCode]?: FeatureState };

const codePromiseCache: { [key in FeatureCode]?: Promise<any> } = {};

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

const defaultFeature = {} as Feature;

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

        const codesToFetch = codes.filter((code) => {
            if (codePromiseCache[code] !== undefined) {
                return false;
            }
            return !isValidFeature(featuresState[code]);
        });

        if (codesToFetch.length) {
            const promise = getSilentApi(extraArgument.api)<{
                Features: Feature[];
            }>(getFeatures(codesToFetch)).then(({ Features }) => {
                const fetchedAt = Date.now() + getMinuteJitter();
                const result = Features.reduce<FeaturesState>(
                    (acc, Feature) => {
                        acc[Feature.Code as FeatureCode] = { value: Feature, meta: { fetchedAt } };
                        return acc;
                    },
                    codesToFetch.reduce<FeaturesState>((acc, code) => {
                        acc[code] = { value: defaultFeature, meta: { fetchedAt } };
                        return acc;
                    }, {})
                );
                dispatch(featuresReducer.actions['fetch/fulfilled']({ codes: codesToFetch, features: result }));
                return result;
            });

            codesToFetch.forEach((code) => {
                codePromiseCache[code] = promise;

                promise
                    .finally(() => {
                        delete codePromiseCache[code];
                    })
                    .catch(() => {});
            });
        }

        const promises = unique(codes.map((code) => codePromiseCache[code]).filter(Boolean));
        if (promises.length) {
            await Promise.all(promises);
        }

        const latestFeaturesState = selectFeatures(getState());
        return Object.fromEntries(
            codes.map((code) => {
                return [code, latestFeaturesState[code]?.value || featuresState[code]?.value || defaultFeature];
            })
        ) as ThunkResult<T>;
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
