import {
    type Action,
    ActionReducerMapBuilder,
    Draft,
    ThunkDispatch,
    createAction,
    miniSerializeError,
} from '@reduxjs/toolkit';
import { ThunkAction } from 'redux-thunk';

import { defaultExpiry, getFetchedAt as getDefaultFetchedAt, isNotStale } from '@proton/shared/lib/helpers/fetchedAt';

import type { CacheType, ReducerValue, ThunkOptions } from './interface';
import { createPromiseCache } from './promiseCache';

export const createAsyncModelThunk = <Returned, State, Extra, ThunkArg = void>(
    prefix: string,
    {
        miss,
        previous,
    }: {
        miss: (extra: {
            dispatch: ThunkDispatch<State, Extra, Action>;
            getState: () => State;
            extraArgument: Extra;
            options?: ThunkOptions<ThunkArg>;
        }) => Promise<Returned>;
        previous: (extra: {
            dispatch: ThunkDispatch<State, Extra, Action>;
            getState: () => State;
            extraArgument: Extra;
            options?: ThunkOptions<ThunkArg>;
        }) => Promise<Returned> | undefined;
    }
) => {
    const pending = createAction(`${prefix}/pending`, () => ({
        payload: undefined,
    }));

    const fulfilled = createAction(`${prefix}/fulfilled`, (payload: Returned) => ({
        payload,
    }));

    const rejected = createAction(`${prefix}/failed`, (payload: any) => ({
        payload,
    }));

    const promiseCache = createPromiseCache<Returned>();

    const thunk = (
        options?: ThunkOptions<ThunkArg>
    ): ThunkAction<
        Promise<Returned>,
        State,
        Extra,
        ReturnType<typeof pending> | ReturnType<typeof fulfilled> | ReturnType<typeof rejected>
    > => {
        return (dispatch, getState, extraArgument) => {
            const select = () => {
                return previous({ dispatch, getState, extraArgument, options });
            };
            const cb = async () => {
                try {
                    dispatch(pending());
                    const value = await miss({ dispatch, getState, extraArgument, options });
                    dispatch(fulfilled(value));
                    return value;
                } catch (error) {
                    dispatch(rejected(miniSerializeError(error)));
                    throw error;
                }
            };
            return promiseCache(select, cb);
        };
    };

    return {
        pending,
        fulfilled,
        rejected,
        thunk,
    };
};

export const handleAsyncModel = <Returned, State, Extra, Options>(
    builder: ActionReducerMapBuilder<ReducerValue<Returned>>,
    cases: ReturnType<typeof createAsyncModelThunk<Returned, State, Extra, Options>>,
    { getFetchedAt }: { getFetchedAt: typeof getDefaultFetchedAt } = { getFetchedAt: getDefaultFetchedAt }
) => {
    return builder
        .addCase(cases.pending, (state) => {
            state.error = undefined;
        })
        .addCase(cases.fulfilled, (state, action) => {
            state.value = action.payload as Draft<Returned> | undefined;
            state.error = undefined;
            state.meta.fetchedAt = getFetchedAt();
        })
        .addCase(cases.rejected, (state, action) => {
            state.error = action.payload;
            state.meta.fetchedAt = getFetchedAt();
        });
};

export const getValidModel = <T>({ value, cache }: { value: T; cache?: CacheType }) => {
    if (value !== undefined && cache === 'stale') {
        return Promise.resolve(value);
    }
};

export const previousSelector =
    <Returned, State, Extra, ThunkArg = void>(
        selector: (state: State) => ReducerValue<Returned>,
        expiry = defaultExpiry
    ): ((extra: {
        dispatch: ThunkDispatch<State, Extra, Action>;
        getState: () => State;
        extraArgument: Extra;
        options?: ThunkOptions<ThunkArg>;
    }) => Promise<Returned> | undefined) =>
    ({ getState, options }) => {
        const state = selector(getState());
        if (!state) {
            return;
        }
        return getValidModel({
            value: state.value,
            cache: options?.cache ?? (isNotStale(state.meta?.fetchedAt, expiry) ? 'stale' : undefined),
        });
    };

export const selectPersistModel = <T>(state: ReducerValue<T>) => {
    if (state.error || state.value === undefined) {
        return undefined;
    }
    return state;
};
