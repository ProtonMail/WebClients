import type { PayloadAction } from '@reduxjs/toolkit';
import { createSlice } from '@reduxjs/toolkit';
import type { ThunkAction } from 'redux-thunk';

import { CacheType, defaultExpiry, getFetchedAt, isExpired } from '@proton/redux-utilities';
import { getFeatures, updateFeatureValue } from '@proton/shared/lib/api/features';
import { getSilentApi } from '@proton/shared/lib/api/helpers/customConfig';
import { DAY } from '@proton/shared/lib/constants';
import type { Api } from '@proton/shared/lib/interfaces';

import type { Feature, FeatureCode } from './interface';

const defaultCacheType = CacheType.StaleRefetch;
// Expiry for when we need to refetch
const expiry = defaultExpiry;
// Expiry for when we treat the feature as archived
const archivedExpiry = DAY * 14;
// Can be any truthy value. It relies on the meta field never being stored
const fetchedEphemeral = true;

interface FeatureState {
    value: Feature;
    meta: { fetchedAt: number; fetchedEphemeral: typeof fetchedEphemeral | undefined };
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

export type FeaturesResponse = {
    Features: Feature[];
};

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
        delete: (state, action: PayloadAction<{ codes: FeatureCode[] }>) => {
            for (const code of action.payload.codes) {
                delete state[code];
            }
        },
    },
});

const isFeatureExpired = (featureState: FeatureState | undefined, cache?: CacheType): featureState is FeatureState => {
    return (
        cache === CacheType.None || featureState?.value === undefined || isExpired(featureState.meta.fetchedAt, expiry)
    );
};

const isStaleRefetch = (featureState: FeatureState | undefined, cache?: CacheType): featureState is FeatureState => {
    return cache === CacheType.StaleRefetch && featureState?.meta.fetchedEphemeral !== fetchedEphemeral;
};

export const shouldFeatureRefetch = (
    featureState: FeatureState | undefined,
    cache = defaultCacheType
): featureState is FeatureState => {
    return isFeatureExpired(featureState, cache) || isStaleRefetch(featureState, cache);
};

type ThunkResult<Key extends FeatureCode> = { [key in Key]: Feature };

const defaultFeature = {} as Feature;

export const fetchFeatures = <T extends FeatureCode>(
    codes: T[],
    options?: {
        cache: CacheType;
    }
): ThunkAction<
    Promise<ThunkResult<T>>,
    FeaturesReducerState,
    ThunkArguments,
    | ReturnType<(typeof featuresReducer.actions)['fetch/fulfilled']>
    | ReturnType<(typeof featuresReducer.actions)['delete']>
> => {
    const cache = options?.cache ?? defaultCacheType;

    return async (dispatch, getState, extraArgument) => {
        let featuresState = selectFeatures(getState());

        const archivedFeatureCodes = Object.entries(featuresState).reduce<FeatureCode[]>((acc, [key, value]) => {
            if (isExpired(value.meta.fetchedAt, archivedExpiry)) {
                acc.push(key as FeatureCode);
            }
            return acc;
        }, []);
        if (archivedFeatureCodes.length) {
            dispatch(featuresReducer.actions.delete({ codes: archivedFeatureCodes }));
            featuresState = selectFeatures(getState());
        }

        const codesToFetch = codes.filter((code) => {
            if (codePromiseCache[code] !== undefined) {
                return false;
            }
            return shouldFeatureRefetch(featuresState[code], cache);
        });

        if (codesToFetch.length) {
            const promise = getSilentApi(extraArgument.api)<FeaturesResponse>(getFeatures(codesToFetch)).then(
                ({ Features }) => {
                    const fetchedAt = getFetchedAt();
                    const result = Features.reduce<FeaturesState>(
                        (acc, Feature) => {
                            acc[Feature.Code as FeatureCode] = {
                                value: Feature,
                                meta: { fetchedAt, fetchedEphemeral },
                            };
                            return acc;
                        },
                        codesToFetch.reduce<FeaturesState>((acc, code) => {
                            acc[code] = { value: defaultFeature, meta: { fetchedAt, fetchedEphemeral } };
                            return acc;
                        }, {})
                    );
                    dispatch(featuresReducer.actions['fetch/fulfilled']({ codes: codesToFetch, features: result }));
                    return result;
                }
            );

            codesToFetch.forEach((code) => {
                codePromiseCache[code] = promise;

                promise
                    .finally(() => {
                        delete codePromiseCache[code];
                    })
                    .catch(() => {});
            });
        }

        const promises = codes.reduce((acc, code) => {
            const promise = codePromiseCache[code];
            // Only wait for the promise if the current value can not be used
            if (promise && isFeatureExpired(featuresState[code], options?.cache)) {
                acc.add(promise);
            }
            return acc;
        }, new Set<Promise<void>>());

        if (promises.size) {
            await Promise.all(promises);
            featuresState = selectFeatures(getState());
        }

        return Object.fromEntries(
            codes.map((code) => {
                return [code, featuresState[code]?.value || defaultFeature];
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
                    feature: {
                        value: Feature,
                        meta: { fetchedAt: getFetchedAt(), fetchedEphemeral },
                    },
                })
            );
            return value;
        } catch (error) {
            dispatch(featuresReducer.actions['update/rejected']({ code, feature: current }));
            throw error;
        }
    };
};
