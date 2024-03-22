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
        }) => ReducerValue<Returned>;
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
                const oldValue = previous({ dispatch, getState, extraArgument, options })?.value;
                if (oldValue !== undefined && !options?.forceFetch) {
                    return Promise.resolve(oldValue);
                }
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
