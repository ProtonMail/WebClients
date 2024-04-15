import { describe, expect, test } from '@jest/globals';
import { configureStore, createSlice } from '@reduxjs/toolkit';

import { createAsyncModelThunk, handleAsyncModel } from './creator';

describe('creator', () => {
    test('creates the action types', () => {
        const thunkActionCreator = createAsyncModelThunk<number, { value: number; error: any }, any>('myState/fetch', {
            miss: async () => 42,
            previous: (store) => {
                return store.getState().value;
            },
        });

        expect(thunkActionCreator.fulfilled.type).toBe('myState/fetch/fulfilled');
        expect(thunkActionCreator.pending.type).toBe('myState/fetch/pending');
        expect(thunkActionCreator.rejected.type).toBe('myState/fetch/failed');
    });

    interface ModelState<T> {
        value: T | undefined;
        error: any;
    }

    interface StoreState<T> {
        myState: ModelState<T>;
    }

    const stateKey = 'myState';

    const selectState = <T>(state: StoreState<T>) => state[stateKey];

    const setup = <T>(miss: () => Promise<T>) => {
        const initialState: ModelState<T> = {
            value: undefined,
            error: undefined,
        };

        const thunkActionCreator = createAsyncModelThunk<T, StoreState<T>, undefined>('myState/fetch', {
            miss,
            previous: (store) => {
                return selectState(store.getState()).value;
            },
        });

        const slice = createSlice({
            name: 'myState',
            initialState,
            reducers: {},
            extraReducers: (builder) => {
                handleAsyncModel(builder, thunkActionCreator);
            },
        });

        const actions: any[] = [];

        const getNewStore = () =>
            configureStore({
                reducer: {
                    [stateKey]: slice.reducer,
                },
                middleware: (getDefaultMiddleware) => {
                    return getDefaultMiddleware({}).prepend(() => (next) => (action) => {
                        actions.push(action);
                        return next(action);
                    });
                },
            });

        return {
            getNewStore,
            actions,
            thunkActionCreator,
        };
    };

    test('successfully syncs to a value', async () => {
        const value = 42;

        const { getNewStore, actions, thunkActionCreator } = setup(async () => value);

        const store = getNewStore();

        expect(selectState(store.getState())).toEqual({ value: undefined, error: undefined });
        const promise = store.dispatch(thunkActionCreator.thunk());
        expect(actions[1]).toEqual(thunkActionCreator.pending());

        await expect(promise).resolves.toEqual(value);

        expect(selectState(store.getState())).toEqual({ value: value, error: undefined });
        expect(actions[2]).toEqual(thunkActionCreator.fulfilled(value));
    });

    test("successfully returns previous promise when it's pending", async () => {
        const value = 42;
        const fn = async () => value;

        const { getNewStore, thunkActionCreator } = setup(fn);

        const store = getNewStore();
        const promise1 = store.dispatch(thunkActionCreator.thunk());
        const promise2 = store.dispatch(thunkActionCreator.thunk());
        expect(promise1).toBe(promise2);
        await promise1;
        const promise3 = store.dispatch(thunkActionCreator.thunk());
        expect(promise1).not.toBe(promise3);
    });

    test("successfully returns previous value when it's been set", async () => {
        const value = 42;
        const fn = jest.fn(async () => value);

        const { getNewStore, thunkActionCreator } = setup(fn);

        const store = getNewStore();
        await expect(store.dispatch(thunkActionCreator.thunk())).resolves.toEqual(value);
        expect(fn).toHaveBeenCalledTimes(1);
        await expect(store.dispatch(thunkActionCreator.thunk())).resolves.toEqual(value);
        expect(fn).toHaveBeenCalledTimes(1);
    });

    test('successfully rejects with an error', async () => {
        const error = new Error('Something went wrong');
        const { getNewStore, actions, thunkActionCreator } = setup(async () => {
            throw error;
        });

        const store = getNewStore();

        expect(selectState(store.getState())).toEqual({ value: undefined, error: undefined });
        const promise = store.dispatch(thunkActionCreator.thunk());
        expect(actions[1]).toEqual(thunkActionCreator.pending());

        await expect(promise).rejects.toThrow(error);

        const serializedError = { message: error.message, name: error.name, stack: error.stack };
        expect(selectState(store.getState())).toEqual({
            value: undefined,
            error: serializedError,
        });
        expect(actions[2]).toEqual(thunkActionCreator.rejected(serializedError));
    });

    test('successfully retries after a failure', async () => {
        const value = 42;
        const error = new Error('Something went wrong');
        let calls = 0;
        const { getNewStore, actions, thunkActionCreator } = setup(async () => {
            if (calls++ === 0) {
                throw error;
            }
            return value;
        });

        const store = getNewStore();

        expect(selectState(store.getState())).toEqual({ value: undefined, error: undefined });
        const promise = store.dispatch(thunkActionCreator.thunk());
        expect(actions[1]).toEqual(thunkActionCreator.pending());

        await expect(promise).rejects.toThrow(error);

        const serializedError = { message: error.message, name: error.name, stack: error.stack };
        expect(selectState(store.getState())).toEqual({
            value: undefined,
            error: serializedError,
        });
        expect(actions[2]).toEqual(thunkActionCreator.rejected(serializedError));

        const successfulPromise = store.dispatch(thunkActionCreator.thunk());
        expect(selectState(store.getState())).toEqual({ value: undefined, error: undefined });
        expect(actions[4]).toEqual(thunkActionCreator.pending());

        await expect(successfulPromise).resolves.toEqual(value);

        expect(selectState(store.getState())).toEqual({ value: value, error: undefined });
        expect(actions[5]).toEqual(thunkActionCreator.fulfilled(value));
    });
});
