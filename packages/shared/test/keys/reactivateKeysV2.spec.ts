import { OpenPGPKey } from 'pmcrypto';
import { User as tsUser, Address as tsAddress, Key, User, DecryptedKey, Address } from '../../lib/interfaces';
import {
    getHasMigratedAddressKey,
    getDecryptedUserKeys,
    getDecryptedAddressKeys,
    reactivateKeysProcess,
} from '../../lib/keys';
import { KeyReactivationData, KeyReactivationRecord } from '../../lib/keys/reactivation/interface';
import { getAddressKey, getLegacyAddressKey, getUserKey } from './keyDataHelper';

const DEFAULT_KEYPASSWORD = '1';

interface FullKey {
    key: {
        privateKey: OpenPGPKey;
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
const getKeyActivationRecords = async (
    records: Record[],
    userKeys: DecryptedKey[],
    keyPassword: string,
    User: User
): Promise<KeyReactivationRecord[]> => {
    return Promise.all(
        records.map(async (record) => {
            if (record.user) {
                return {
                    user: record.user,
                    keysToReactivate: record.keysToReactivate.map(getKeyToReactivate),
                    keys: userKeys,
                };
            }
            return {
                address: record.address,
                keysToReactivate: record.keysToReactivate.map(getKeyToReactivate),
                keys: record.address
                    ? await getDecryptedAddressKeys({
                          address: record.address,
                          addressKeys: record.address.Keys,
                          user: User,
                          userKeys,
                          keyPassword,
                      })
                    : userKeys,
            };
        })
    );
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
    const User = ({
        Keys: UserKeys,
    } as unknown) as tsUser;
    const address1 = 'test@test.com';
    const userKeys = await getDecryptedUserKeys({ user: User, userKeys: UserKeys, keyPassword });
    const addressKeysFull = await Promise.all([
        getAddressKey('a', userKeysFull[0].key.privateKey, address1),
        getAddressKey('b', userKeysFull[0].key.privateKey, address1),
        getAddressKey('c', userKeysFull[1].key.privateKey, address1),
        getAddressKey('d', userKeysFull[1].key.privateKey, address1),
        getAddressKey('e', userKeysFull[2].key.privateKey, address1),
    ]);
    const AddressKeys = addressKeysFull.map(({ Key }) => Key);
    const Addresses = ([
        {
            ID: 'my-address',
            Email: address1,
            Keys: AddressKeys,
        },
    ] as unknown) as tsAddress[];
    const keyReactivationRecords = await getKeyActivationRecords(
        [
            {
                user: User,
                keysToReactivate: [userKeysFull[1]],
            },
            {
                address: Addresses[0],
                keysToReactivate: [addressKeysFull[2], addressKeysFull[3]],
            },
        ],
        userKeys,
        keyPassword,
        User
    );
    return {
        keyPassword,
        oldKeyPassword,
        User,
        Addresses,
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
    const User = ({
        Keys: UserKeys,
    } as unknown) as tsUser;
    const address1 = 'test@test.com';
    const address2 = 'test2@test.com';
    const address3 = 'test3@test.com';
    const userKeys = await getDecryptedUserKeys({ user: User, userKeys: UserKeys, keyPassword });
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
    const Addresses = ([
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
    ] as unknown) as tsAddress[];
    const keyReactivationRecords = await getKeyActivationRecords(
        [
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
        ],
        userKeys,
        keyPassword,
        User
    );

    return {
        keyPassword,
        oldKeyPassword,
        User,
        Addresses,
        userKeys,
        expectedAddressKeysReactivated: [
            addressKeys1Full[1].key.privateKey,
            addressKeys3Full[0].key.privateKey,
            addressKeys3Full[1].key.privateKey,
        ],
        keyReactivationRecords,
    };
};

describe('reactivate keys', () => {
    it('reactivate user keys and the connected address keys', async () => {
        const {
            keyPassword,
            keyReactivationRecords,
            User,
            Addresses,
            userKeys,
            expectedAddressKeysReactivated,
        } = await getSetup1();
        const onReactivation = jasmine.createSpy('on reactivation');
        const api = jasmine.createSpy('api').and.returnValues(Promise.resolve(), Promise.resolve());
        await reactivateKeysProcess({
            api,
            user: User,
            userKeys,
            addresses: Addresses,
            keyReactivationRecords,
            keyPassword,
            onReactivation,
        });
        expect(api.calls.count()).toEqual(1);
        expect(onReactivation.calls.count()).toEqual(3);
        expect(onReactivation.calls.allArgs()).toEqual([
            ['2', 'ok'],
            ['c', 'ok'],
            ['d', 'ok'],
        ]);
        const keyReactivationCall = api.calls.argsFor(0)[0];
        expect(keyReactivationCall).toEqual({
            url: 'keys/user/2',
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
        const {
            keyPassword,
            keyReactivationRecords,
            User,
            Addresses,
            userKeys,
            expectedAddressKeysReactivated,
        } = await getSetup2();
        const onReactivation = jasmine.createSpy('on reactivation');
        const api = jasmine.createSpy('api').and.returnValues(Promise.resolve(), Promise.resolve());
        await reactivateKeysProcess({
            api,
            user: User,
            userKeys,
            addresses: Addresses,
            keyReactivationRecords,
            keyPassword,
            onReactivation,
        });

        expect(onReactivation.calls.count()).toEqual(7);
        expect(onReactivation.calls.allArgs()).toEqual([
            ['2', 'ok'],
            ['b', 'ok'],
            ['a2', 'ok'],
            ['b2', 'ok'],
            ['b1', jasmine.any(Error)],
            ['c1', 'ok'],
            ['c2', 'ok'],
        ]);

        expect(api.calls.count()).toEqual(3);

        expect(api.calls.argsFor(0)[0]).toEqual({
            url: 'keys/user/2',
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
            url: 'keys/address/c1',
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
            url: 'keys/address/c2',
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
});
