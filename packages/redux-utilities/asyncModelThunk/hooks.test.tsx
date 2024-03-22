import { describe, expect, test } from '@jest/globals';
import { configureStore, createSlice } from '@reduxjs/toolkit';
import { act, render, waitFor } from '@testing-library/react';

import { ProtonStoreProvider } from '@proton/redux-shared-store/sharedProvider';

import { createAsyncModelThunk, handleAsyncModel } from './creator';
import { createHooks } from './hooks';

interface ModelState<T> {
    value: T | undefined;
    error: any;
}

describe('hooks', () => {
    interface StoreState<T> {
        myState: ModelState<T>;
    }

    const stateKey = 'myState';

    const selectState = <T,>(state: StoreState<T>) => state[stateKey];

    const setup = <T,>(miss: () => Promise<T>) => {
        const initialState: ModelState<T> = {
            value: undefined,
            error: undefined,
        };

        const thunkActionCreator = createAsyncModelThunk<T, StoreState<T>, undefined>('myState/fetch', {
            miss,
            previous: (store) => {
                const old = selectState(store.getState());
                return {
                    value: old.value,
                    error: old.error,
                };
            },
        });

        const slice = createSlice({
            name: 'myState',
            initialState,
            reducers: {
                reset: (state) => {
                    state.value = undefined;
                    state.error = undefined;
                },
            },
            extraReducers: (builder) => {
                handleAsyncModel(builder, thunkActionCreator);
            },
        });

        const getNewStore = () =>
            configureStore({
                reducer: {
                    [stateKey]: slice.reducer,
                },
            });

        return {
            slice,
            getNewStore,
            thunkActionCreator,
        };
    };

    test('successfully selects a value', async () => {
        const { getNewStore, thunkActionCreator } = setup(async () => 42);
        const store = getNewStore();
        const hooks = createHooks(thunkActionCreator.thunk, selectState);

        const Component = () => {
            const [value, loading] = hooks.useValue();
            return <div data-testid="result">{`${value}, ${loading}`}</div>;
        };

        const { getByTestId } = render(
            <ProtonStoreProvider store={store}>
                <Component />
            </ProtonStoreProvider>
        );

        const div = getByTestId('result');
        expect(div).toHaveTextContent('undefined, true');
        await waitFor(() => expect(div).toHaveTextContent('42, false'));
    });

    test('only dispatches on undefined values', async () => {
        const { getNewStore, thunkActionCreator } = setup(async () => 42);
        const store = getNewStore();
        const spy = jest.spyOn(thunkActionCreator, 'thunk');
        const hooks = createHooks(thunkActionCreator.thunk, selectState);

        const Component = () => {
            const [value, loading] = hooks.useValue();
            return <div data-testid="result">{`${value}, ${loading}`}</div>;
        };

        const { getByTestId } = render(
            <ProtonStoreProvider store={store}>
                <Component />
            </ProtonStoreProvider>
        );

        expect(spy).toHaveBeenCalledTimes(0);
        const div = getByTestId('result');
        expect(div).toHaveTextContent('undefined, true');

        await waitFor(() => expect(div).toHaveTextContent('42, false'));

        expect(spy).toHaveBeenCalledTimes(1);

        render(
            <ProtonStoreProvider store={store}>
                <Component />
            </ProtonStoreProvider>
        );

        expect(spy).toHaveBeenCalledTimes(1);
    });

    test('re-dispatches when value becomes undefined', async () => {
        const { getNewStore, thunkActionCreator, slice } = setup(async () => 42);
        const store = getNewStore();
        const spy = jest.spyOn(thunkActionCreator, 'thunk');
        const hooks = createHooks(thunkActionCreator.thunk, selectState);

        const Component = () => {
            const [value, loading] = hooks.useValue();
            return <div data-testid="result">{`${value}, ${loading}`}</div>;
        };

        const { getByTestId } = render(
            <ProtonStoreProvider store={store}>
                <Component />
            </ProtonStoreProvider>
        );

        expect(spy).toHaveBeenCalledTimes(0);

        const div = getByTestId('result');
        expect(div).toHaveTextContent('undefined, true');
        await waitFor(() => expect(div).toHaveTextContent('42, false'));

        expect(spy).toHaveBeenCalledTimes(1);

        render(
            <ProtonStoreProvider store={store}>
                <Component />
            </ProtonStoreProvider>
        );

        expect(spy).toHaveBeenCalledTimes(1);

        act(() => {
            store.dispatch(slice.actions.reset());
        });

        render(
            <ProtonStoreProvider store={store}>
                <Component />
            </ProtonStoreProvider>
        );

        expect(spy).toHaveBeenCalledTimes(1);
        expect(div).toHaveTextContent('undefined, true');
        await waitFor(() => expect(div).toHaveTextContent('42, false'));

        expect(spy).toHaveBeenCalledTimes(2);

        render(
            <ProtonStoreProvider store={store}>
                <Component />
            </ProtonStoreProvider>
        );

        expect(spy).toHaveBeenCalledTimes(2);
    });
});
