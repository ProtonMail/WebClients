import { User as tsUser, Key as tsKey, Address as tsAddress, DecryptedKey } from '../../lib/interfaces';
import {
    getDecryptedUserKeys,
    getDecryptedAddressKeys,
    reactivateKeysProcess,
    KeyReactivationRecord,
} from '../../lib/keys';
import { getLegacyAddressKey, getUserKey } from './keyDataHelper';

const DEFAULT_KEYPASSWORD = '1';

const getKeyToReactivate = ({ key: { privateKey }, Key }: { key: DecryptedKey; Key: tsKey }) => ({
    Key,
    id: Key.ID,
    privateKey,
});

const getSetup1 = async () => {
    const keyPassword = DEFAULT_KEYPASSWORD;
    const oldKeyPassword = 'abc';
    const userKeysFull = await Promise.all([
        getUserKey('1', keyPassword),
        getUserKey('2', oldKeyPassword),
        getUserKey('3', oldKeyPassword),
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
        getLegacyAddressKey('a', keyPassword, address1),
        getLegacyAddressKey('b', oldKeyPassword, address1),
    ]);
    const AddressKeys1 = addressKeys1Full.map(({ Key }) => Key);
    const addressKeys2Full = await Promise.all([
        getLegacyAddressKey('a1', keyPassword, address2),
        getLegacyAddressKey('b1', 'foo', address2),
    ]);
    const AddressKeys2 = addressKeys2Full.map(({ Key }) => Key);
    const addressKeys3Full = await Promise.all([
        getLegacyAddressKey('a2', oldKeyPassword, address3),
        getLegacyAddressKey('b2', oldKeyPassword, address3),
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
    const keyReactivationRecords: KeyReactivationRecord[] = await Promise.all(
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
                keysToReactivate: [],
            },
            {
                address: Addresses[2],
                keysToReactivate: [addressKeys3Full[0], addressKeys3Full[1], addressKeys3Full[2]],
            },
        ].map(async (r) => {
            return {
                ...r,
                keysToReactivate: r.keysToReactivate.map(getKeyToReactivate),
                keys: r.address
                    ? await getDecryptedAddressKeys({
                          address: r.address,
                          addressKeys: r.address.Keys,
                          user: User,
                          userKeys,
                          keyPassword,
                      })
                    : userKeys,
            };
        })
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
    it('reactivate user and address keys in legacy mode', async () => {
        const { keyPassword, keyReactivationRecords, User, Addresses, userKeys } = await getSetup1();
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
        expect(api.calls.count()).toEqual(5);
        expect(onReactivation.calls.allArgs()).toEqual([
            ['2', 'ok'],
            ['b', 'ok'],
            ['a2', 'ok'],
            ['b2', 'ok'],
            ['c2', 'ok'],
        ]);
        const keyReactivationCall1 = api.calls.argsFor(0)[0];
        expect(keyReactivationCall1).toEqual({
            url: 'keys/2',
            method: 'put',
            data: {
                PrivateKey: jasmine.any(String),
                SignedKeyList: undefined,
            },
        });
        const keyReactivationCall2 = api.calls.argsFor(1)[0];
        expect(keyReactivationCall2).toEqual({
            url: 'keys/b',
            method: 'put',
            data: {
                PrivateKey: jasmine.any(String),
                SignedKeyList: {
                    Data: jasmine.any(String),
                    Signature: jasmine.any(String),
                },
            },
        });
    });
});
