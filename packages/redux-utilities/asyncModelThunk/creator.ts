import {
    type Action,
    ActionReducerMapBuilder,
    Draft,
    ThunkDispatch,
    createAction,
    miniSerializeError,
} from '@reduxjs/toolkit';
import { ThunkAction } from 'redux-thunk';

import type { ReducerValue, ThunkOptions } from './interface';

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
        }) => ReducerValue<Returned>;
    }
) => {
    const pending = createAction(`${prefix}/pending`, (id: string) => ({
        payload: undefined,
        meta: { id },
    }));

    const fulfilled = createAction(`${prefix}/fulfilled`, (payload: Returned, id: string) => ({
        payload,
        meta: { id },
    }));

    const rejected = createAction(`${prefix}/failed`, (payload: any, id: string) => ({
        payload,
        meta: { id },
    }));

    const promises: { [key: string]: Promise<Returned> | undefined } = {};

    const thunk = (
        options?: ThunkOptions<ThunkArg>
    ): ThunkAction<
        Promise<Returned>,
        State,
        Extra,
        ReturnType<typeof pending> | ReturnType<typeof fulfilled> | ReturnType<typeof rejected>
    > => {
        return (dispatch, getState, extraArgument) => {
            const id = (options?.thunkArg || 'default') as string;
            const previousPromise = promises[id];
            if (previousPromise) {
                return previousPromise;
            }
            const old = previous({ dispatch, getState, extraArgument, options });
            if (old.value !== undefined && !old.error && !options?.forceFetch) {
                return Promise.resolve(old.value);
            }
            const run = async () => {
                dispatch(pending(id));
                try {
                    const value = await miss({ dispatch, getState, extraArgument, options });
                    dispatch(fulfilled(value, id));
                    delete promises[id];
                    return value;
                } catch (error) {
                    dispatch(rejected(miniSerializeError(error), id));
                    delete promises[id];
                    throw error;
                }
            };
            const promise = run();
            promises[id] = promise;
            return promise;
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
    cases: ReturnType<typeof createAsyncModelThunk<Returned, State, Extra, Options>>
) => {
    return builder
        .addCase(cases.pending, (state) => {
            state.error = undefined;
        })
        .addCase(cases.fulfilled, (state, action) => {
            state.value = action.payload as Draft<Returned> | undefined;
            state.error = undefined;
        })
        .addCase(cases.rejected, (state, action) => {
            state.error = action.payload;
            state.value = undefined;
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
    }) => ReducerValue<Returned>) =>
    (extra) =>
        selector(extra.getState());
