import { expect } from '@jest/globals';
import { combineReducers } from '@reduxjs/toolkit';
import { waitFor } from '@testing-library/react';

import { getServerEvent } from '@proton/account/test/getServerEvent';
import { CryptoProxy } from '@proton/crypto';
import type { ProtonThunkArguments } from '@proton/redux-shared-store-types';
import { getTestStore } from '@proton/redux-shared-store/test';
import type { UserModel } from '@proton/shared/lib/interfaces';
import { getDecryptedUserKeysHelper } from '@proton/shared/lib/keys';

import { getModelState } from '../test';
import { userReducer } from '../user';
import * as module from './index';
import { selectUserKeys, userKeysReducer, userKeysThunk } from './index';
import { userKeysListener } from './listener';

const mockedUserKeysThunk = jest.spyOn(module, 'userKeysThunk');
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

const defaultUser = {
    Flags: {},
} as UserModel;

const defaultPrivateKey = {} as UserModel['Keys'][0];

const reducer = combineReducers({
    ...userReducer,
    ...userKeysReducer,
});
const setup = (preloadedState?: Partial<ReturnType<typeof reducer>>) => {
    const actions: any[] = [];

    const extraThunkArguments = {
        authentication: {
            getPassword: () => {},
        },
    } as ProtonThunkArguments;

    const { store, startListening } = getTestStore({
        preloadedState: {
            user: getModelState({ ...defaultUser, Keys: [{ ...defaultPrivateKey, PrivateKey: '1' }] }),
            ...preloadedState,
        },
        reducer,
        extraThunkArguments,
    });

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

        store.dispatch(getServerEvent({ User: { ...defaultUser, Keys: [{ ...defaultPrivateKey, PrivateKey: '1' }] } }));
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
        store.dispatch(getServerEvent({ User: { ...defaultUser, Keys: [{ ...defaultPrivateKey, PrivateKey: '2' }] } }));
        expect(mockedUserKeysThunk).toHaveBeenCalledTimes(2);

        await waitFor(() => expect(mockedGetDecryptedUserKeysHelper).toHaveBeenCalledTimes(2));
        expect(selectUserKeys(store.getState()).value).toEqual(result2);

        expect(mockedCryptoProxy.clearKey).toHaveBeenCalledTimes(4);
        expect(mockedCryptoProxy.clearKey.mock.calls[0][0]).toEqual({ key: firstUserKeysResult[0].privateKey });

        // Again without any change should not trigger anything.
        store.dispatch(
            getServerEvent({
                User: {
                    ...defaultUser,
                    Name: 'b',
                    Keys: [{ ...defaultPrivateKey, PrivateKey: '2' }],
                },
            })
        );
        expect(mockedUserKeysThunk).toHaveBeenCalledTimes(2);
    });
});
