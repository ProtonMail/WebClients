import { describe, expect, test } from '@jest/globals';
import { configureStore, createSlice } from '@reduxjs/toolkit';

import { DAY } from '@proton/shared/lib/constants';

import { createAsyncModelThunk, handleAsyncModel, previousSelector } from './creator';

describe('creator', () => {
    test('creates the action types', () => {
        const thunkActionCreator = createAsyncModelThunk<
            number,
            {
                value: number;
                error: any;
                meta: { fetchedAt: 0 };
            },
            any
        >('myState/fetch', {
            miss: async () => 42,
            previous: previousSelector((state) => state),
        });

        expect(thunkActionCreator.fulfilled.type).toBe('myState/fetch/fulfilled');
        expect(thunkActionCreator.pending.type).toBe('myState/fetch/pending');
        expect(thunkActionCreator.rejected.type).toBe('myState/fetch/failed');
    });

    interface ModelState<T> {
        value: T | undefined;
        error: any;
        meta: {
            fetchedAt: 0;
        };
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
            meta: {
                fetchedAt: 0,
            },
        };

        const getFetchedAt = jest.fn(() => 0);

        const thunkActionCreator = createAsyncModelThunk<T, StoreState<T>, undefined>('myState/fetch', {
            miss,
            previous: previousSelector(selectState, DAY),
        });

        const slice = createSlice({
            name: 'myState',
            initialState,
            reducers: {},
            extraReducers: (builder) => {
                handleAsyncModel(builder, thunkActionCreator, { getFetchedAt });
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
            getFetchedAt,
        };
    };

    test('successfully syncs to a value', async () => {
        const value = 42;

        const { getNewStore, actions, thunkActionCreator, getFetchedAt } = setup(async () => value);

        const store = getNewStore();

        expect(selectState(store.getState())).toEqual({ value: undefined, error: undefined, meta: { fetchedAt: 0 } });
        getFetchedAt.mockImplementation(() => 1);
        const promise = store.dispatch(thunkActionCreator.thunk());
        expect(actions[1]).toEqual(thunkActionCreator.pending());

        await expect(promise).resolves.toEqual(value);

        expect(selectState(store.getState())).toEqual({ value: value, error: undefined, meta: { fetchedAt: 1 } });
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

        const { getNewStore, thunkActionCreator, getFetchedAt } = setup(fn);

        const store = getNewStore();
        getFetchedAt.mockImplementation(() => Date.now());
        await expect(store.dispatch(thunkActionCreator.thunk())).resolves.toEqual(value);
        expect(fn).toHaveBeenCalledTimes(1);
        await expect(store.dispatch(thunkActionCreator.thunk())).resolves.toEqual(value);
        expect(fn).toHaveBeenCalledTimes(1);
    });

    test("successfully re-fetches when it's expired", async () => {
        const value = 42;
        const fn = jest.fn(async () => value);

        const { getNewStore, thunkActionCreator, getFetchedAt } = setup(fn);

        const store = getNewStore();
        getFetchedAt.mockImplementation(() => 1);
        await expect(store.dispatch(thunkActionCreator.thunk())).resolves.toEqual(value);
        expect(fn).toHaveBeenCalledTimes(1);
        getFetchedAt.mockImplementation(() => Date.now());
        await expect(store.dispatch(thunkActionCreator.thunk())).resolves.toEqual(value);
        expect(fn).toHaveBeenCalledTimes(2);
        await expect(store.dispatch(thunkActionCreator.thunk())).resolves.toEqual(value);
        expect(fn).toHaveBeenCalledTimes(2);
    });

    test('successfully rejects with an error', async () => {
        const error = new Error('Something went wrong');
        const { getNewStore, actions, thunkActionCreator, getFetchedAt } = setup(async () => {
            throw error;
        });

        const store = getNewStore();
        getFetchedAt.mockImplementation(() => 1);

        expect(selectState(store.getState())).toEqual({ value: undefined, error: undefined, meta: { fetchedAt: 0 } });
        const promise = store.dispatch(thunkActionCreator.thunk());
        expect(actions[1]).toEqual(thunkActionCreator.pending());

        await expect(promise).rejects.toThrow(error);

        const serializedError = { message: error.message, name: error.name, stack: error.stack };
        expect(selectState(store.getState())).toEqual({
            value: undefined,
            error: serializedError,
            meta: { fetchedAt: 1 },
        });
        expect(actions[2]).toEqual(thunkActionCreator.rejected(serializedError));
    });

    test('successfully retries after a failure', async () => {
        const value = 42;
        const error = new Error('Something went wrong');
        let calls = 0;
        const { getNewStore, actions, thunkActionCreator, getFetchedAt } = setup(async () => {
            if (calls++ === 0) {
                throw error;
            }
            return value;
        });

        const store = getNewStore();
        getFetchedAt.mockImplementation(() => 1);

        expect(selectState(store.getState())).toEqual({ value: undefined, error: undefined, meta: { fetchedAt: 0 } });
        const promise = store.dispatch(thunkActionCreator.thunk());
        expect(actions[1]).toEqual(thunkActionCreator.pending());

        await expect(promise).rejects.toThrow(error);

        const serializedError = { message: error.message, name: error.name, stack: error.stack };
        expect(selectState(store.getState())).toEqual({
            value: undefined,
            error: serializedError,
            meta: { fetchedAt: 1 },
        });
        expect(actions[2]).toEqual(thunkActionCreator.rejected(serializedError));

        const successfulPromise = store.dispatch(thunkActionCreator.thunk());
        getFetchedAt.mockImplementation(() => 2);
        expect(selectState(store.getState())).toEqual({ value: undefined, error: undefined, meta: { fetchedAt: 1 } });
        expect(actions[4]).toEqual(thunkActionCreator.pending());

        await expect(successfulPromise).resolves.toEqual(value);

        expect(selectState(store.getState())).toEqual({ value: value, error: undefined, meta: { fetchedAt: 2 } });
        expect(actions[5]).toEqual(thunkActionCreator.fulfilled(value));
    });
});
