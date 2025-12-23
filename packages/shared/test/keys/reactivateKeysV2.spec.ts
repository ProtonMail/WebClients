import type { PrivateKeyReference } from '@proton/crypto';

import type { Address, Key, User, Address as tsAddress, User as tsUser } from '../../lib/interfaces';
import {
    getDecryptedAddressKeysHelper,
    getDecryptedUserKeysHelper,
    getHasMigratedAddressKey,
    reactivateKeysProcess,
} from '../../lib/keys';
import type { KeyReactivationData, KeyReactivationRecord } from '../../lib/keys/reactivation/interface';
import { getAddressKey, getAddressKeyHelper, getLegacyAddressKey, getUserKey } from './keyDataHelper';

const DEFAULT_KEYPASSWORD = '1';

interface FullKey {
    key: {
        privateKey: PrivateKeyReference;
    };
    Key: Key;
    uploadedKey?: boolean;
}

const getKeyToReactivate = ({ key: { privateKey }, Key, uploadedKey = false }: FullKey) => {
    if (getHasMigratedAddressKey(Key) && !uploadedKey) {
        return {
            Key,
            id: Key.ID,
        } as KeyReactivationData;
    }
    return {
        Key,
        id: Key.ID,
        privateKey,
    };
};

type Record =
    | { address: Address; user?: undefined; keysToReactivate: FullKey[] }
    | { address?: undefined; user: User; keysToReactivate: FullKey[] };
const getKeyActivationRecords = (records: Record[]): KeyReactivationRecord[] => {
    return records.map((record) => {
        if (record.user) {
            return {
                user: record.user,
                keysToReactivate: record.keysToReactivate.map(getKeyToReactivate),
            };
        }
        return {
            address: record.address,
            keysToReactivate: record.keysToReactivate.map(getKeyToReactivate),
        };
    });
};
const getSetup1 = async () => {
    const keyPassword = DEFAULT_KEYPASSWORD;
    const oldKeyPassword = 'abc';
    const userKeysFull = await Promise.all([
        getUserKey('1', keyPassword),
        getUserKey('2', oldKeyPassword),
        getUserKey('3', 'foo'),
    ]);
    const UserKeys = userKeysFull.map(({ Key }) => Key);
    const User = {
        Keys: UserKeys,
    } as unknown as tsUser;
    const address1 = 'test@test.com';
    const userKeys = await getDecryptedUserKeysHelper(User, keyPassword);
    const addressKeysFull = await Promise.all([
        getAddressKey('a', userKeysFull[0].key.privateKey, address1),
        getAddressKey('b', userKeysFull[0].key.privateKey, address1),
        getAddressKey('c', userKeysFull[1].key.privateKey, address1),
        getAddressKey('d', userKeysFull[1].key.privateKey, address1),
        getAddressKey('e', userKeysFull[2].key.privateKey, address1),
    ]);
    const AddressKeys = addressKeysFull.map(({ Key }) => Key);
    const Addresses = [
        {
            ID: 'my-address',
            Email: address1,
            Keys: AddressKeys,
        },
    ] as unknown as tsAddress[];
    const keyReactivationRecords = getKeyActivationRecords([
        {
            user: User,
            keysToReactivate: [userKeysFull[1]],
        },
        {
            address: Addresses[0],
            keysToReactivate: [addressKeysFull[2], addressKeysFull[3]],
        },
    ]);
    const addressesKeys = await Promise.all(
        Addresses.map(async (address) => {
            return {
                address,
                keys: await getDecryptedAddressKeysHelper(address.Keys, User, userKeys, keyPassword),
            };
        })
    );
    return {
        keyPassword,
        oldKeyPassword,
        User,
        Addresses,
        addressesKeys,
        userKeys,
        expectedUserKeysReactivated: [userKeysFull[1].key.privateKey],
        expectedAddressKeysReactivated: [addressKeysFull[2].key.privateKey, addressKeysFull[3].key.privateKey],
        keyReactivationRecords,
    };
};

const getSetup2 = async () => {
    const keyPassword = DEFAULT_KEYPASSWORD;
    const oldKeyPassword = 'abc';
    const userKeysFull = await Promise.all([
        getUserKey('1', keyPassword),
        getUserKey('2', oldKeyPassword),
        getUserKey('3', 'foo'),
    ]);
    const UserKeys = userKeysFull.map(({ Key }) => Key);
    const User = {
        Keys: UserKeys,
    } as unknown as tsUser;
    const address1 = 'test@test.com';
    const address2 = 'test2@test.com';
    const address3 = 'test3@test.com';
    const userKeys = await getDecryptedUserKeysHelper(User, keyPassword);
    const addressKeys1Full = await Promise.all([
        getAddressKey('a', userKeysFull[0].key.privateKey, address1),
        getAddressKey('b', userKeysFull[1].key.privateKey, address1),
    ]);
    const AddressKeys1 = addressKeys1Full.map(({ Key }) => Key);
    const addressKeys2Full = await Promise.all([
        getAddressKey('a1', userKeysFull[0].key.privateKey, address2),
        getAddressKey('b1', userKeysFull[2].key.privateKey, address2),
        getAddressKey('c1', userKeysFull[2].key.privateKey, address2),
    ]);
    const AddressKeys2 = addressKeys2Full.map(({ Key }) => Key);
    const addressKeys3Full = await Promise.all([
        getAddressKey('a2', userKeysFull[1].key.privateKey, address3),
        getAddressKey('b2', userKeysFull[1].key.privateKey, address3),
        getLegacyAddressKey('c2', oldKeyPassword, address3),
    ]);
    const AddressKeys3 = addressKeys3Full.map(({ Key }) => Key);
    const Addresses = [
        {
            ID: 'my-address-1',
            Email: address1,
            Keys: AddressKeys1,
        },
        {
            ID: 'my-address-2',
            Email: address2,
            Keys: AddressKeys2,
        },
        {
            ID: 'my-address-3',
            Email: address3,
            Keys: AddressKeys3,
        },
    ] as unknown as tsAddress[];
    const keyReactivationRecords = getKeyActivationRecords([
        {
            user: User,
            keysToReactivate: [userKeysFull[1]],
        },
        {
            address: Addresses[0],
            keysToReactivate: [addressKeys1Full[1]],
        },
        {
            address: Addresses[1],
            keysToReactivate: [addressKeys2Full[1], { ...addressKeys2Full[2], uploadedKey: true }],
        },
        {
            address: Addresses[2],
            keysToReactivate: [addressKeys3Full[0], addressKeys3Full[1], addressKeys3Full[2]],
        },
    ]);
    const addressesKeys = await Promise.all(
        Addresses.map(async (address) => {
            return {
                address,
                keys: await getDecryptedAddressKeysHelper(address.Keys, User, userKeys, keyPassword),
            };
        })
    );

    return {
        keyPassword,
        oldKeyPassword,
        User,
        Addresses,
        addressesKeys,
        userKeys,
        expectedAddressKeysReactivated: [
            addressKeys1Full[1].key.privateKey,
            addressKeys3Full[0].key.privateKey,
            addressKeys3Full[1].key.privateKey,
        ],
        keyReactivationRecords,
    };
};

const getSetup3 = async () => {
    const keyPassword = DEFAULT_KEYPASSWORD;
    const oldKeyPassword = '2';
    const userKeysFull = await Promise.all([getUserKey('1', keyPassword), getUserKey('2', oldKeyPassword)]);
    const UserKeys = userKeysFull.map(({ Key }) => Key);
    const User = {
        Keys: UserKeys,
    } as unknown as tsUser;
    const address1 = 'test@test.com';
    const userKeys = await getDecryptedUserKeysHelper(User, keyPassword);
    const addressKeys1Full = await Promise.all([
        getAddressKey('a', userKeysFull[0].key.privateKey, address1),
        getAddressKeyHelper('b', userKeysFull[1].key.privateKey, userKeysFull[1].key.privateKey),
    ]);
    const AddressKeys1 = addressKeys1Full.map(({ Key }) => Key);
    const Addresses = [
        {
            ID: 'my-address-1',
            Email: address1,
            Keys: AddressKeys1,
        },
    ] as unknown as tsAddress[];
    const keyReactivationRecords = getKeyActivationRecords([
        {
            user: User,
            keysToReactivate: [{ ...userKeysFull[1], uploadedKey: true }],
        },
        {
            address: Addresses[0],
            keysToReactivate: [{ ...addressKeys1Full[1], uploadedKey: true }],
        },
    ]);
    const addressesKeys = await Promise.all(
        Addresses.map(async (address) => {
            return {
                address,
                keys: await getDecryptedAddressKeysHelper(address.Keys, User, userKeys, keyPassword),
            };
        })
    );

    return {
        keyPassword,
        oldKeyPassword,
        User,
        Addresses,
        addressesKeys,
        userKeys,
        expectedAddressKeysReactivated: [addressKeys1Full[1].key.privateKey],
        keyReactivationRecords,
    };
};

describe('reactivate keys', () => {
    it('reactivate user keys and the connected address keys', async () => {
        const { keyPassword, keyReactivationRecords, User, Addresses, userKeys, expectedAddressKeysReactivated } =
            await getSetup1();
        const api = jasmine.createSpy('api').and.returnValues(Promise.resolve(), Promise.resolve());
        const result = await reactivateKeysProcess({
            api,
            user: User,
            userKeys,
            addresses: Addresses,
            keyReactivationRecords,
            keyPassword,
            keyTransparencyVerify: async () => {},
        });
        expect(api.calls.count()).toEqual(1);
        expect(result.details).toEqual([
            { id: '2', type: 'success' },
            { id: 'c', type: 'success' },
            { id: 'd', type: 'success' },
        ]);
        const keyReactivationCall = api.calls.argsFor(0)[0];
        expect(keyReactivationCall).toEqual({
            url: 'core/v4/keys/user/2',
            method: 'put',
            data: jasmine.objectContaining({
                PrivateKey: jasmine.any(String),
                AddressKeyFingerprints: expectedAddressKeysReactivated.map((x) => x.getFingerprint()),
                SignedKeyLists: {
                    [Addresses[0].ID]: {
                        Data: jasmine.any(String),
                        Signature: jasmine.any(String),
                    },
                },
            }),
        });
    });

    it('reactivate user keys and the connected address keys, and legacy address keys', async () => {
        const { keyPassword, keyReactivationRecords, User, Addresses, userKeys, expectedAddressKeysReactivated } =
            await getSetup2();
        const api = jasmine.createSpy('api').and.returnValues(Promise.resolve(), Promise.resolve());
        const result = await reactivateKeysProcess({
            api,
            user: User,
            userKeys,
            addresses: Addresses,
            keyReactivationRecords,
            keyPassword,
            keyTransparencyVerify: async () => {},
        });

        expect(result.details).toEqual([
            { id: '2', type: 'success' },
            { id: 'b', type: 'success' },
            { id: 'a2', type: 'success' },
            { id: 'b2', type: 'success' },
            { id: 'b1', error: jasmine.objectContaining({ message: 'User key inactive' }), type: 'error' },
            { id: 'c1', type: 'success' },
            { id: 'c2', type: 'success' },
        ]);

        expect(api.calls.count()).toEqual(3);

        expect(api.calls.argsFor(0)[0]).toEqual({
            url: 'core/v4/keys/user/2',
            method: 'put',
            data: jasmine.objectContaining({
                PrivateKey: jasmine.any(String),
                AddressKeyFingerprints: expectedAddressKeysReactivated.map((x) => x.getFingerprint()),
                SignedKeyLists: {
                    [Addresses[0].ID]: {
                        Data: jasmine.any(String),
                        Signature: jasmine.any(String),
                    },
                    [Addresses[2].ID]: {
                        Data: jasmine.any(String),
                        Signature: jasmine.any(String),
                    },
                },
            }),
        });

        expect(api.calls.argsFor(1)[0]).toEqual({
            url: 'core/v4/keys/address/c1',
            method: 'put',
            data: {
                Token: jasmine.any(String),
                Signature: jasmine.any(String),
                PrivateKey: jasmine.any(String),
                SignedKeyList: {
                    Data: jasmine.any(String),
                    Signature: jasmine.any(String),
                },
            },
        });

        expect(api.calls.argsFor(2)[0]).toEqual({
            url: 'core/v4/keys/address/c2',
            method: 'put',
            data: {
                Token: jasmine.any(String),
                Signature: jasmine.any(String),
                PrivateKey: jasmine.any(String),
                SignedKeyList: {
                    Data: jasmine.any(String),
                    Signature: jasmine.any(String),
                },
            },
        });
    });

    it('reactivate user keys and the connected address keys', async () => {
        const { keyPassword, keyReactivationRecords, User, Addresses, userKeys, expectedAddressKeysReactivated } =
            await getSetup3();
        const api = jasmine.createSpy('api').and.callFake(() => Promise.resolve());
        const result = await reactivateKeysProcess({
            api,
            user: User,
            userKeys,
            addresses: Addresses,
            keyReactivationRecords,
            keyPassword,
            keyTransparencyVerify: async () => {},
        });

        expect(result.details).toEqual([
            { id: '2', type: 'success' },
            { id: 'b', type: 'success' },
        ]);

        expect(api.calls.count()).toEqual(1);

        expect(api.calls.argsFor(0)[0]).toEqual({
            url: 'core/v4/keys/user/2',
            method: 'put',
            data: jasmine.objectContaining({
                PrivateKey: jasmine.any(String),
                AddressKeyFingerprints: expectedAddressKeysReactivated.map((x) => x.getFingerprint()),
                SignedKeyLists: {
                    [Addresses[0].ID]: {
                        Data: jasmine.any(String),
                        Signature: jasmine.any(String),
                    },
                },
            }),
        });
    });
});
