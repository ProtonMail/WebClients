import { expect } from '@jest/globals';
import { combineReducers } from '@reduxjs/toolkit';
import { waitFor } from '@testing-library/react';

import { CryptoProxy } from '@proton/crypto';
import type { ProtonThunkArguments } from '@proton/redux-shared-store';
import { getTestStore } from '@proton/redux-shared-store/test';
import { EVENT_ACTIONS } from '@proton/shared/lib/constants';
import type { Address, AddressKey, DecryptedAddressKey, UserModel } from '@proton/shared/lib/interfaces';
import { getDecryptedAddressKeysHelper, getDecryptedUserKeysHelper } from '@proton/shared/lib/keys';

import { addressesReducer } from '../addresses';
import { serverEvent } from '../eventLoop';
import { getModelState } from '../test';
import { userReducer } from '../user';
import { userKeysReducer } from '../userKeys';
import * as addressKeysModule from './index';
import { addressKeysFulfilledAction, addressKeysReducer, addressKeysThunk, selectAddressKeys } from './index';
import { addressKeysListener } from './listener';

const mockedAddressKeysThunk = jest.spyOn(addressKeysModule, 'addressKeysThunk');

jest.mock('@proton/srp', () => {});
jest.mock('@proton/crypto', () => {
    return {
        CryptoProxy: {
            clearKey: jest.fn(),
            getKeyInfo: jest.fn(() =>
                Promise.resolve({
                    fingerprint: 'fingerprint',
                })
            ),
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

const getTestAddressKey = (id: string, token: string): AddressKey => {
    return {
        ID: id,
        Primary: 1,
        Active: 1,
        Flags: 7,
        Fingerprint: id + 'FP',
        Fingerprints: [id + 'FP1', id + 'FP2'],
        PublicKey: id + 'pk',
        Version: 6,
        Activation: id + 'activation',
        PrivateKey: id + 'secret',
        Token: token,
        Signature: id + 'signature',
        AddressForwardingID: null,
    };
};

const setup = (preloadedState?: Partial<typeof reducer>) => {
    const actions: any[] = [];

    const extraThunkArguments = {
        authentication: {
            getPassword: () => {},
        },
    } as ProtonThunkArguments;

    const { store, startListening } = getTestStore({
        reducer,
        preloadedState: {
            user: getModelState({ Keys: [{ PrivateKey: '123' }] } as UserModel),
            addresses: getModelState([{ Keys: [getTestAddressKey('123', '123')] }] as Address[]),
            ...preloadedState,
        },
        extraThunkArguments,
    });

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

const getKey = (id: number) => ({ ID: id.toString(), privateKey: id, publicKey: id }) as unknown as DecryptedAddressKey;

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
        store.dispatch(addressKeysFulfilledAction({ id: '1', value: newResult }));
        expect(selectAddressKeys(store.getState())['1'].value).toEqual(newResult);
        expect(selectAddressKeys(store.getState())['2'].value).toBe(initialState['2'].value);

        await waitFor(() => expect(mockedCryptoProxy.clearKey).toHaveBeenCalledTimes(2));
        expect(mockedCryptoProxy.clearKey.mock.calls[0][0]).toEqual({ key: firstKeys[0].privateKey });
        expect(mockedCryptoProxy.clearKey.mock.calls[1][0]).toEqual({ key: firstKeys[0].publicKey });
    });

    const getAddress = (data: { ID: string; Keys: AddressKey[] }) => {
        return {
            ...data,
        } as unknown as Address;
    };

    it('should recompute address keys when addresses changed', async () => {
        const initialState = {
            '1': getModelState([getKey(1)]),
        };
        const { store } = setup({
            addresses: getModelState([getAddress({ ID: '1', Keys: [getTestAddressKey('1', 'a')] })]),
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
                        Address: getAddress({ ID: '2', Keys: [getTestAddressKey('2', 'b')] }),
                    },
                ],
            })
        );
        expect(selectAddressKeys(store.getState())).toEqual({ ...initialState });
        expect(mockedAddressKeysThunk).toHaveBeenCalledTimes(0);

        const result = [getKey(3)];
        mockedGetDecryptedAddressKeysHelper.mockReturnValue(result);
        await store.dispatch(addressKeysThunk({ addressID: '2' }));
        expect(mockedAddressKeysThunk).toHaveBeenCalledTimes(1);
        expect(selectAddressKeys(store.getState())).toEqual({ ...initialState, '2': { value: result } });

        store.dispatch(
            serverEvent({
                Addresses: [
                    {
                        ID: '3',
                        Action: EVENT_ACTIONS.CREATE,
                        Address: getAddress({ ID: '3', Keys: [getTestAddressKey('3', 'b')] }),
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
                        Address: getAddress({ ID: '2', Keys: [getTestAddressKey('4', 'b')] }),
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
                        Address: getAddress({ ID: '2', Keys: [getTestAddressKey('4', 'b')] }),
                    },
                ],
            })
        );

        expect(mockedAddressKeysThunk).toHaveBeenCalledTimes(2);
    });
});
