import type { ActionReducerMapBuilder, Draft, ThunkDispatch } from '@reduxjs/toolkit';
import { type Action, createAction, miniSerializeError } from '@reduxjs/toolkit';
import type { ThunkAction } from 'redux-thunk';

import { getFetchedAt as getDefaultFetchedAt, getFetchedEphemeral } from './fetchedAt';
import type { ReducerValue, ThunkOptions } from './interface';
import { cacheHelper, createPromiseStore } from './promiseStore';

export const createAsyncModelThunk = <Returned, State, Extra, ThunkArg = void>(
    prefix: string,
    {
        expiry,
        miss,
        previous,
    }: {
        expiry?: number;
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
        }) => ReducerValue<Returned> | undefined;
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

    const promiseStore = createPromiseStore<Returned>();

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
            return cacheHelper({ store: promiseStore, select, cb, cache: options?.cache, expiry });
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
    {
        getFetchedAt,
    }: {
        getFetchedAt: typeof getDefaultFetchedAt;
    } = { getFetchedAt: getDefaultFetchedAt }
) => {
    return builder
        .addCase(cases.pending, (state) => {
            state.error = undefined;
        })
        .addCase(cases.fulfilled, (state, action) => {
            state.value = action.payload as Draft<Returned> | undefined;
            state.error = undefined;
            state.meta.fetchedAt = getFetchedAt();
            state.meta.fetchedEphemeral = getFetchedEphemeral();
        })
        .addCase(cases.rejected, (state, action) => {
            state.error = action.payload;
            state.meta.fetchedAt = getFetchedAt();
            state.meta.fetchedEphemeral = getFetchedEphemeral();
        });
};

export const previousSelector =
    <Returned, State, Extra, ThunkArg = void>(
        selector: (state: State) => ReducerValue<Returned>
    ): ((extra: {
        dispatch: ThunkDispatch<State, Extra, Action>;
        getState: () => State;
        extraArgument: Extra;
        options?: ThunkOptions<ThunkArg>;
    }) => ReducerValue<Returned> | undefined) =>
    ({ getState }) => {
        return selector(getState());
    };

export const selectPersistModel = <T>(state: ReducerValue<T>) => {
    if (state.error || state.value === undefined) {
        return undefined;
    }
    return state;
};
