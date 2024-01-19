import { PayloadAction, createSlice } from '@reduxjs/toolkit';
import { ThunkAction } from 'redux-thunk';

import { getFeatures, updateFeatureValue } from '@proton/shared/lib/api/features';
import { getSilentApi } from '@proton/shared/lib/api/helpers/customConfig';
import type { Api } from '@proton/shared/lib/interfaces';

import type { Feature, FeatureCode } from './interface';

const codePromiseCache: { [key in FeatureCode]?: Promise<Feature> } = {};

const initialState = {} as { [key in FeatureCode]?: Feature };

export interface FeaturesState {
    features: typeof initialState;
}

export const selectFeatures = (state: FeaturesState) => state.features;

type FeatureObject = { [key in FeatureCode]?: Feature };

export interface ThunkArguments {
    api: Api;
}

export const featuresReducer = createSlice({
    name: 'features',
    initialState,
    reducers: {
        'fetch/fulfilled': (state, action: PayloadAction<{ codes: FeatureCode[]; features: FeatureObject }>) => {
            return {
                ...state,
                ...action.payload.features,
            };
        },
        'update/pending': (state, action: PayloadAction<{ code: FeatureCode; feature: any }>) => {
            const old = state[action.payload.code];
            if (old) {
                state[action.payload.code] = {
                    ...old,
                    Value: action.payload.feature,
                };
            }
        },
        'update/fulfilled': (state, action: PayloadAction<{ code: FeatureCode; feature: Feature<any> }>) => {
            state[action.payload.code] = {
                ...state[action.payload.code],
                ...action.payload.feature,
            };
        },
        'update/rejected': (state, action: PayloadAction<{ code: FeatureCode; feature: Feature<any> | undefined }>) => {
            state[action.payload.code] = action.payload.feature;
        },
    },
});

export const fetchFeatures = (
    codes: FeatureCode[]
): ThunkAction<
    Promise<FeatureObject>,
    FeaturesState,
    ThunkArguments,
    ReturnType<(typeof featuresReducer.actions)['fetch/fulfilled']>
> => {
    return async (dispatch, getState, extraArgument) => {
        const state = selectFeatures(getState());

        if (codes.length === 1) {
            const code = codes[0];
            if (state[code]) {
                return { [code]: state[code] };
            }
            const promise = codePromiseCache[code];
            if (promise) {
                const result = await promise;
                return { [code]: result };
            }
        }

        const codesToFetch = codes.filter((code) => {
            return !state[code] && !codePromiseCache[code];
        });

        if (codesToFetch.length) {
            const promise = getSilentApi(extraArgument.api)<{
                Features: Feature[];
            }>(getFeatures(codesToFetch)).then(({ Features }) => {
                const result = Features.reduce<FeatureObject>(
                    (acc, Feature) => {
                        acc[Feature.Code as FeatureCode] = Feature;
                        return acc;
                    },
                    codesToFetch.reduce<FeatureObject>((acc, code) => {
                        acc[code] = {} as Feature;
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

        return Promise.all(
            codes.map(async (code): Promise<[FeatureCode, Promise<Feature | undefined> | Feature | undefined]> => {
                return [code, (await codePromiseCache[code]) || state[code]];
            })
        ).then((result): FeatureObject => {
            return Object.fromEntries(result);
        });
    };
};

export const updateFeature = (
    code: FeatureCode,
    value: any
): ThunkAction<
    Promise<Feature>,
    FeaturesState,
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
                    feature: value,
                })
            );
            const { Feature } = await getSilentApi(extraArgument.api)<{
                Feature: Feature;
            }>(updateFeatureValue(code, value));
            dispatch(featuresReducer.actions['update/fulfilled']({ code, feature: Feature }));
            return value;
        } catch (error) {
            dispatch(featuresReducer.actions['update/rejected']({ code, feature: current }));
            throw error;
        }
    };
};
