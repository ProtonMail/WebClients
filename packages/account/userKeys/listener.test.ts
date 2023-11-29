import { expect } from '@jest/globals';
import { TypedStartListening, combineReducers, configureStore, createListenerMiddleware } from '@reduxjs/toolkit';
import { waitFor } from '@testing-library/react';

import { CryptoProxy } from '@proton/crypto';
import type { EventManager } from '@proton/shared/lib/eventManager/eventManager';
import type { Api, UserModel } from '@proton/shared/lib/interfaces';
import { getDecryptedUserKeysHelper } from '@proton/shared/lib/keys';

import { serverEvent } from '../eventLoop';
import { getModelState } from '../test';
import { userReducer } from '../user';
import * as module from './index';
import { selectUserKeys, userKeysReducer, userKeysThunk } from './index';
import { userKeysListener } from './listener';

const mockedUserKeysThunk = jest.spyOn(module, 'userKeysThunk');
jest.mock('@proton/shared/lib/authentication/authentication', () => ({
    __esModule: true,
    default: {
        getPassword: () => {},
    },
}));
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
        getDecryptedUserKeysHelper: jest.fn().mockReturnValue([]),
    };
});

const reducer = combineReducers({
    ...userReducer,
    ...userKeysReducer,
});
const setup = (preloadedState?: Partial<ReturnType<typeof reducer>>) => {
    const actions: any[] = [];

    interface ThunkArguments {
        api: Api;
        eventManager: EventManager;
    }

    const extraThunkArguments = {} as ThunkArguments;

    const listenerMiddleware = createListenerMiddleware({ extra: extraThunkArguments });

    const store = configureStore({
        preloadedState: {
            user: getModelState({ Keys: [{ PrivateKey: '1' }] } as UserModel),
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

    userKeysListener(startListening);

    return {
        store,
        actions,
    };
};

const mockedGetDecryptedUserKeysHelper = getDecryptedUserKeysHelper as jest.MockedFunction<any>;
const mockedCryptoProxy = CryptoProxy as jest.MockedObject<any>;
mockedCryptoProxy.clearKey.mockImplementation(async () => {});

const getKey = (id: number) => ({ privateKey: id, publicKey: id });

describe('user keys listener', () => {
    it('should react to user object server events when initialised', async () => {
        const { store } = setup();

        store.dispatch(serverEvent({ User: { Keys: [{ PrivateKey: '1' }] } as unknown as UserModel }));
        expect(mockedUserKeysThunk).toHaveBeenCalledTimes(0);
        expect(mockedGetDecryptedUserKeysHelper).toHaveBeenCalledTimes(0);
        expect(selectUserKeys(store.getState()).value).toBeUndefined();

        const firstUserKeysResult = [getKey(1), getKey(2)];
        mockedGetDecryptedUserKeysHelper.mockReturnValue(firstUserKeysResult);
        await store.dispatch(userKeysThunk());

        expect(mockedUserKeysThunk).toHaveBeenCalledTimes(1);
        expect(mockedGetDecryptedUserKeysHelper).toHaveBeenCalledTimes(1);
        expect(selectUserKeys(store.getState()).value).toEqual(firstUserKeysResult);

        const result2 = [getKey(3), getKey(4), getKey(5)];
        mockedGetDecryptedUserKeysHelper.mockReturnValue(result2);
        store.dispatch(serverEvent({ User: { Keys: [{ PrivateKey: '2' }] } as unknown as UserModel }));
        expect(mockedUserKeysThunk).toHaveBeenCalledTimes(2);

        await waitFor(() => expect(mockedGetDecryptedUserKeysHelper).toHaveBeenCalledTimes(2));
        expect(selectUserKeys(store.getState()).value).toEqual(result2);

        expect(mockedCryptoProxy.clearKey).toHaveBeenCalledTimes(4);
        expect(mockedCryptoProxy.clearKey.mock.calls[0][0]).toEqual({ key: firstUserKeysResult[0].privateKey });

        // Again without any change should not trigger anything.
        store.dispatch(serverEvent({ User: { Name: 'b', Keys: [{ PrivateKey: '2' }] } as unknown as UserModel }));
        expect(mockedUserKeysThunk).toHaveBeenCalledTimes(2);
    });
});
