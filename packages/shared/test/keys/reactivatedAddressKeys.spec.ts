import { User as tsUser, Address as tsAddress } from '../../lib/interfaces';
import { getDecryptedUserKeys, getDecryptedAddressKeys } from '../../lib/keys';
import {
    getAddressReactivationPayload,
    getReactivatedAddressesKeys,
    getReactivatedAddressKeys,
} from '../../lib/keys/reactivation/reactivateKeyHelper';
import { getAddressKey, getUserKey } from './keyDataHelper';

const DEFAULT_KEYPASSWORD = '1';

const getSetup1 = async () => {
    const keyPassword = DEFAULT_KEYPASSWORD;
    const UserKeysFull = await Promise.all([getUserKey('1', keyPassword), getUserKey('2', keyPassword)]);
    const User = ({
        Keys: UserKeysFull.map(({ Key }) => Key),
    } as unknown) as tsUser;
    const address1 = 'test@test.com';
    const userKeys = await getDecryptedUserKeys({ user: User, userKeys: User.Keys, keyPassword });
    const addressKeysFull = await Promise.all([
        getAddressKey('a', userKeys[0].privateKey, address1),
        getAddressKey('b', userKeys[0].privateKey, address1),
        getAddressKey('c', userKeys[1].privateKey, address1),
    ]);
    const Address = ({
        ID: 'AddressID',
        Email: address1,
        Keys: addressKeysFull.map(({ Key }) => Key),
    } as unknown) as tsAddress;
    return {
        User,
        Address,
        userKeys,
        addressKeys: await getDecryptedAddressKeys({
            addressKeys: Address.Keys,
            address: Address,
            user: User,
            userKeys,
            keyPassword,
        }),
    };
};

const getSetup2 = async () => {
    const keyPassword = DEFAULT_KEYPASSWORD;
    const UserKeysFull = await Promise.all([
        getUserKey('1', keyPassword),
        getUserKey('2', keyPassword),
        getUserKey('3', keyPassword),
        getUserKey('4', keyPassword),
    ]);
    const User = ({
        Keys: UserKeysFull.map(({ Key }) => Key),
    } as unknown) as tsUser;
    const address1 = 'test@test.com';
    const userKeys = await getDecryptedUserKeys({ user: User, userKeys: User.Keys, keyPassword });
    const AddressKeys1 = await Promise.all([
        getAddressKey('1a', userKeys[0].privateKey, address1),
        getAddressKey('1b', userKeys[0].privateKey, address1),
        getAddressKey('1c', userKeys[1].privateKey, address1),
        getAddressKey('1d', userKeys[2].privateKey, address1),
    ]);
    const address2 = 'test2@test.com';
    const AddressKeys2 = await Promise.all([
        getAddressKey('2a', userKeys[1].privateKey, address2),
        getAddressKey('2b', userKeys[1].privateKey, address2).then((r) => ({ ...r, Key: { ...r.Key, Flags: 0 } })),
        getAddressKey('2c', userKeys[2].privateKey, address2),
        getAddressKey('2d', userKeys[2].privateKey, address2),
        getAddressKey('2e', userKeys[3].privateKey, address2),
    ]);
    const Address1 = ({
        ID: 'AddressID-1',
        Email: address1,
        Keys: AddressKeys1.map(({ Key }) => Key),
    } as unknown) as tsAddress;
    const Address2 = ({
        ID: 'AddressID-2',
        Email: address2,
        Keys: AddressKeys2.map(({ Key }) => Key),
    } as unknown) as tsAddress;
    return {
        User,
        Addresses: [Address1, Address2],
        userKeys,
        addressKeys1: await getDecryptedAddressKeys({
            addressKeys: Address1.Keys,
            address: Address1,
            user: User,
            userKeys,
            keyPassword,
        }),
        addressKeys2: await getDecryptedAddressKeys({
            addressKeys: Address2.Keys,
            address: Address2,
            user: User,
            userKeys,
            keyPassword,
        }),
    };
};

describe('reactivate address keys', () => {
    it('should return an empty result', async () => {
        const { User, Address, userKeys } = await getSetup1();
        const result = await getReactivatedAddressKeys({
            user: User,
            address: Address,
            oldUserKeys: userKeys,
            newUserKeys: userKeys,
            keyPassword: '',
        });
        expect(result).toEqual({
            address: Address,
            reactivatedKeys: undefined,
            signedKeyList: undefined,
        });
    });

    it('should return keys that got reactivated', async () => {
        const { User, Address, userKeys } = await getSetup1();
        const result = await getReactivatedAddressKeys({
            user: User,
            address: Address,
            oldUserKeys: [userKeys[0]],
            newUserKeys: userKeys,
            keyPassword: '',
        });
        expect(result).toEqual(
            jasmine.objectContaining({
                address: Address,
                reactivatedKeys: jasmine.any(Array),
                signedKeyList: jasmine.any(Object),
            })
        );
    });

    it('should get correct payload from keys that got reactivated', async () => {
        const { User, Address, userKeys, addressKeys } = await getSetup1();
        const result = await getReactivatedAddressKeys({
            user: User,
            address: Address,
            oldUserKeys: [userKeys[0]],
            newUserKeys: userKeys,
            keyPassword: '',
        });
        const payload = await getAddressReactivationPayload([result]);
        expect(payload).toEqual(
            jasmine.objectContaining({
                AddressKeyFingerprints: [...[addressKeys[2]].map(({ privateKey }) => privateKey.getFingerprint())],
                SignedKeyLists: {
                    [Address.ID]: {
                        Data: jasmine.any(String),
                        Signature: jasmine.any(String),
                    },
                },
            })
        );
    });

    it('should get correct payload from keys that got reactivated on multiple addresses', async () => {
        const { User, Addresses, userKeys, addressKeys1, addressKeys2 } = await getSetup2();
        const result = await getReactivatedAddressesKeys({
            user: User,
            addresses: Addresses,
            oldUserKeys: [userKeys[0]],
            newUserKeys: [userKeys[0], userKeys[1]],
            keyPassword: '',
        });
        expect(JSON.parse(result[0].signedKeyList?.Data || '')).toEqual([
            { Primary: 1, Flags: 3, Fingerprint: jasmine.any(String), SHA256Fingerprints: jasmine.any(Array) },
            { Primary: 0, Flags: 3, Fingerprint: jasmine.any(String), SHA256Fingerprints: jasmine.any(Array) },
            {
                Primary: 0,
                Flags: 1,
                Fingerprint: jasmine.any(String),
                SHA256Fingerprints: jasmine.any(Array),
            },
        ]);
        expect(JSON.parse(result[1].signedKeyList?.Data || '')).toEqual([
            { Primary: 1, Flags: 1, Fingerprint: jasmine.any(String), SHA256Fingerprints: jasmine.any(Array) },
            {
                Primary: 0,
                Flags: 0,
                Fingerprint: jasmine.any(String),
                SHA256Fingerprints: jasmine.any(Array),
            },
        ]);
        const payload = await getAddressReactivationPayload(result);
        expect(payload).toEqual(
            jasmine.objectContaining({
                AddressKeyFingerprints: [
                    ...[addressKeys1[2], addressKeys2[0], addressKeys2[1]].map(({ privateKey }) =>
                        privateKey.getFingerprint()
                    ),
                ],
                SignedKeyLists: {
                    [Addresses[0].ID]: {
                        Data: jasmine.any(String),
                        Signature: jasmine.any(String),
                    },
                    [Addresses[1].ID]: {
                        Data: jasmine.any(String),
                        Signature: jasmine.any(String),
                    },
                },
            })
        );
    });
});
