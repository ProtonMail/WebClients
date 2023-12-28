import { expect } from '@jest/globals';
import { TypedStartListening, combineReducers, configureStore, createListenerMiddleware } from '@reduxjs/toolkit';
import { waitFor } from '@testing-library/react';

import { CryptoProxy } from '@proton/crypto';
import type { ProtonThunkArguments } from '@proton/redux-shared-store';
import { EVENT_ACTIONS } from '@proton/shared/lib/constants';
import type { Address, DecryptedAddressKey, UserModel } from '@proton/shared/lib/interfaces';
import { getDecryptedAddressKeysHelper, getDecryptedUserKeysHelper } from '@proton/shared/lib/keys';

import { addressesReducer } from '../addresses';
import { serverEvent } from '../eventLoop';
import { getModelState } from '../test';
import { userReducer } from '../user';
import { userKeysReducer } from '../userKeys';
import * as addressKeysModule from './index';
import { addressKeysReducer, addressKeysThunk, selectAddressKeys } from './index';
import { addressKeysListener } from './listener';
import { addressKeysModelThunk } from './thunk';

const mockedAddressKeysThunk = jest.spyOn(addressKeysModule, 'addressKeysThunk');

jest.mock('@proton/srp', () => {});
jest.mock('@proton/crypto', () => {
    return {
        CryptoProxy: {
            clearKey: jest.fn(),
        },
    };
});
jest.mock('@proton/shared/lib/keys', () => {
    return {
        getDecryptedAddressKeysHelper: jest.fn(),
        getDecryptedUserKeysHelper: jest.fn(),
    };
});

const reducer = combineReducers({
    ...userReducer,
    ...userKeysReducer,
    ...addressesReducer,
    ...addressKeysReducer,
});

const setup = (preloadedState?: Partial<ReturnType<typeof reducer>>) => {
    const actions: any[] = [];

    const extraThunkArguments = {
        authentication: {
            getPassword: () => {},
        },
    } as ProtonThunkArguments;

    const listenerMiddleware = createListenerMiddleware({ extra: extraThunkArguments });

    const store = configureStore({
        preloadedState: {
            user: getModelState({ Keys: [{ PrivateKey: '123' }] } as UserModel),
            addresses: getModelState([{ Keys: [{ PrivateKey: '123' }] }] as Address[]),
            ...preloadedState,
        },
        reducer,
        middleware: (getDefaultMiddleware) =>
            getDefaultMiddleware({
                thunk: { extraArgument: extraThunkArguments },
            }).prepend(listenerMiddleware.middleware),
    });

    type State = ReturnType<typeof store.getState>;
    type Dispatch = typeof store.dispatch;
    type ExtraArgument = typeof extraThunkArguments;

    type AppStartListening = TypedStartListening<State, Dispatch, ExtraArgument>;
    const startListening = listenerMiddleware.startListening as AppStartListening;

    addressKeysListener(startListening);

    return {
        store,
        actions,
    };
};

const mockedCryptoProxy = CryptoProxy as jest.MockedObject<any>;
mockedCryptoProxy.clearKey.mockImplementation(async () => {});

const mockedGetDecryptedAddressKeysHelper = getDecryptedAddressKeysHelper as jest.MockedFunction<any>;
const mockedGetDecryptedUserKeysHelper = getDecryptedUserKeysHelper as jest.MockedFunction<any>;

const getKey = (id: number) => ({ privateKey: id, publicKey: id }) as unknown as DecryptedAddressKey;

describe('address keys keys listener', () => {
    it('should clear address keys when changed', async () => {
        const firstKeys = [getKey(1)];
        const initialState = {
            '1': getModelState(firstKeys),
            '2': getModelState([getKey(3)]),
        };
        const { store } = setup({
            addressKeys: initialState,
        });
        const newResult = [getKey(4), getKey(5)];
        store.dispatch(addressKeysModelThunk.fulfilled(newResult, '1'));
        expect(selectAddressKeys(store.getState())['1'].value).toEqual(newResult);
        expect(selectAddressKeys(store.getState())['2'].value).toBe(initialState['2'].value);

        await waitFor(() => expect(mockedCryptoProxy.clearKey).toHaveBeenCalledTimes(2));
        expect(mockedCryptoProxy.clearKey.mock.calls[0][0]).toEqual({ key: firstKeys[0].privateKey });
        expect(mockedCryptoProxy.clearKey.mock.calls[1][0]).toEqual({ key: firstKeys[0].publicKey });
    });

    const getAddress = (data: {
        ID: string;
        Keys: {
            PrivateKey: string;
            Token: string;
        }[];
    }) => {
        return {
            ...data,
        } as unknown as Address;
    };

    it('should recompute address keys when addresses changed', async () => {
        const initialState = {
            '1': getModelState([getKey(1)]),
        };
        const { store } = setup({
            addresses: getModelState([getAddress({ ID: '1', Keys: [{ PrivateKey: '1', Token: 'a' }] })]),
            addressKeys: initialState,
            userKeys: getModelState([getKey(1)]),
        });
        mockedGetDecryptedUserKeysHelper.mockReturnValue([]);

        store.dispatch(
            serverEvent({
                Addresses: [
                    {
                        ID: '2',
                        Action: EVENT_ACTIONS.CREATE,
                        Address: getAddress({ ID: '2', Keys: [{ PrivateKey: '2', Token: 'b' }] }),
                    },
                ],
            })
        );
        expect(selectAddressKeys(store.getState())).toEqual({ ...initialState });
        expect(mockedAddressKeysThunk).toHaveBeenCalledTimes(0);

        const result = [getKey(3)];
        mockedGetDecryptedAddressKeysHelper.mockReturnValue(result);
        await store.dispatch(addressKeysThunk({ thunkArg: '2' }));
        expect(mockedAddressKeysThunk).toHaveBeenCalledTimes(1);
        expect(selectAddressKeys(store.getState())).toEqual({ ...initialState, '2': { value: result } });

        store.dispatch(
            serverEvent({
                Addresses: [
                    {
                        ID: '3',
                        Action: EVENT_ACTIONS.CREATE,
                        Address: getAddress({ ID: '3', Keys: [{ PrivateKey: '3', Token: 'b' }] }),
                    },
                ],
            })
        );

        expect(selectAddressKeys(store.getState())).toEqual({ ...initialState, '2': { value: result } });
        expect(mockedAddressKeysThunk).toHaveBeenCalledTimes(1);

        const result2 = [getKey(2)];
        mockedGetDecryptedAddressKeysHelper.mockReturnValue(result2);
        store.dispatch(
            serverEvent({
                Addresses: [
                    {
                        ID: '2',
                        Action: EVENT_ACTIONS.UPDATE,
                        Address: getAddress({ ID: '2', Keys: [{ PrivateKey: '4', Token: 'b' }] }),
                    },
                ],
            })
        );

        expect(mockedAddressKeysThunk).toHaveBeenCalledTimes(2);
        await waitFor(() => expect(mockedGetDecryptedAddressKeysHelper).toHaveBeenCalledTimes(2));
        expect(selectAddressKeys(store.getState())).toEqual({ ...initialState, '2': { value: result2 } });

        store.dispatch(
            serverEvent({
                Addresses: [
                    {
                        ID: '2',
                        Action: EVENT_ACTIONS.UPDATE,
                        Address: getAddress({ ID: '2', Keys: [{ PrivateKey: '4', Token: 'b' }] }),
                    },
                ],
            })
        );

        expect(mockedAddressKeysThunk).toHaveBeenCalledTimes(2);
    });
});
