import { CryptoProxy, PrivateKeyReference } from '@proton/crypto';

import { Address as tsAddress, User as tsUser } from '../../lib/interfaces';
import { getDecryptedAddressKeysHelper, getDecryptedUserKeysHelper } from '../../lib/keys';
import { upgradeV2KeysHelper } from '../../lib/keys/upgradeKeysV2';
import { Modulus } from '../authentication/login.data';
import { getAddressKey, getUserKey } from './keyDataHelper';

const DEFAULT_EMAIL = 'test@test.com';
const DEFAULT_KEYPASSWORD = '1';

const getKey = async (email = DEFAULT_EMAIL, keyPassword = DEFAULT_KEYPASSWORD) => {
    const privateKey = await CryptoProxy.generateKey({
        userIDs: [{ name: email, email }],
        curve: 'ed25519',
    });

    return {
        privateKey,
        privateKeyArmored: await CryptoProxy.exportPrivateKey({
            privateKey,
            passphrase: keyPassword,
        }),
    };
};

describe('upgrade keys v2', () => {
    describe('do v2 upgrade', () => {
        it('should upgrade v2 keys', async () => {
            const keyPassword = DEFAULT_KEYPASSWORD;
            const [userKey1, userKey2] = await Promise.all([
                getUserKey('a', keyPassword, 2),
                getUserKey('b', keyPassword, 2),
            ]);
            const User = {
                Keys: [userKey1.Key, userKey2.Key],
            } as tsUser;
            const keys = await Promise.all([
                getAddressKey('c', userKey1.key.privateKey, 'test@test.com', 2),
                getAddressKey('d', userKey1.key.privateKey, 'test@test.com', 2),
                getAddressKey('e', userKey2.key.privateKey, 'test2@test.com', 2),
            ]);

            const Addresses = [
                {
                    Email: 'test@test.com',
                    Keys: [keys[0].Key, keys[1].Key],
                },
                {
                    Email: 'test2@test.com',
                    Keys: [keys[2].Key],
                },
            ] as tsAddress[];
            const api = jasmine.createSpy('api').and.returnValues(Promise.resolve({ Modulus }), Promise.resolve());
            const newKeyPassword = await upgradeV2KeysHelper({
                user: User,
                addresses: Addresses,
                loginPassword: keyPassword,
                keyPassword,
                clearKeyPassword: keyPassword,
                isOnePasswordMode: true,
                api,
                preAuthKTVerify: () => async () => {},
                keyMigrationKTVerifier: async () => {},
            });
            if (!newKeyPassword) {
                throw new Error('Missing new password');
            }
            expect(api.calls.all().length).toBe(2);
            const newKeysArgs = api.calls.all()[1].args[0];
            const decryptedUserKeys = await getDecryptedUserKeysHelper(
                { ...User, Keys: newKeysArgs.data.UserKeys },
                newKeyPassword
            );
            const decryptedAddressesKeys = await getDecryptedAddressKeysHelper(
                newKeysArgs.data.AddressKeys,
                User,
                decryptedUserKeys,
                ''
            );
            expect(decryptedUserKeys.every((key) => key.privateKey.isPrivate())).toBe(true);
            expect(decryptedUserKeys.length).toBe(2 as any);
            expect(decryptedAddressesKeys.every((key) => key.privateKey.isPrivate())).toBe(true);
            expect(decryptedAddressesKeys.length).toBe(3 as any);
            expect(newKeysArgs).toEqual({
                url: 'core/v4/keys/private/upgrade',
                method: 'post',
                data: jasmine.objectContaining({
                    KeySalt: jasmine.any(String),
                    Auth: jasmine.any(Object),
                    UserKeys: jasmine.any(Array),
                    AddressKeys: jasmine.any(Array),
                    SignedKeyLists: jasmine.any(Object),
                }),
            });
            expect(newKeyPassword).toEqual(jasmine.any(String));
        });
    });

    describe('do legacy upgrade', () => {
        it('should upgrade v2 keys', async () => {
            const keyPassword = DEFAULT_KEYPASSWORD;
            const [userKey1, userKey2, addressKey1, addressKey2, addressKey3] = await Promise.all([
                getKey(),
                getKey(),
                getKey(),
                getKey(),
                getKey(),
            ]);
            const User = {
                Keys: [
                    {
                        ID: 'a',
                        PrivateKey: userKey1.privateKeyArmored,
                        Version: 2,
                    },
                    {
                        ID: 'b',
                        PrivateKey: userKey2.privateKeyArmored,
                        Version: 2,
                    },
                ],
            } as tsUser;
            const Addresses = [
                {
                    Email: 'test@test.com',
                    Keys: [
                        {
                            ID: 'c',
                            PrivateKey: addressKey1.privateKeyArmored,
                            Version: 2,
                        },
                        {
                            ID: 'd',
                            PrivateKey: addressKey2.privateKeyArmored,
                            Version: 2,
                        },
                    ],
                },
                {
                    Email: 'test2@test.com',
                    Keys: [
                        {
                            ID: 'e',
                            PrivateKey: addressKey3.privateKeyArmored,
                            Version: 2,
                        },
                    ],
                },
            ] as tsAddress[];
            const api = jasmine.createSpy('api').and.returnValues(Promise.resolve({ Modulus }), Promise.resolve());
            const newKeyPassword = await upgradeV2KeysHelper({
                user: User,
                addresses: Addresses,
                loginPassword: keyPassword,
                keyPassword,
                clearKeyPassword: keyPassword,
                isOnePasswordMode: true,
                api,
                preAuthKTVerify: () => async () => {},
                keyMigrationKTVerifier: async () => {},
            });
            if (!newKeyPassword) {
                throw new Error('Missing new password');
            }
            expect(api.calls.all().length).toBe(2);
            const newKeysArgs = api.calls.all()[1].args[0];
            const decryptedKeys: PrivateKeyReference[] = await Promise.all(
                newKeysArgs.data.Keys.map(({ PrivateKey }: any) => {
                    return CryptoProxy.importPrivateKey({ armoredKey: PrivateKey, passphrase: newKeyPassword });
                })
            );
            expect(decryptedKeys.every((key) => key.isPrivate())).toBe(true);
            expect(decryptedKeys.length).toBe(5);
            expect(newKeysArgs.data.Keys[0].PrivateKey);
            expect(newKeysArgs).toEqual({
                url: 'core/v4/keys/private/upgrade',
                method: 'post',
                data: jasmine.objectContaining({
                    KeySalt: jasmine.any(String),
                    Auth: jasmine.any(Object),
                    Keys: jasmine.any(Array),
                }),
            });
            expect(newKeyPassword).toEqual(jasmine.any(String));
        });

        it('should upgrade v2 keys in two password mode', async () => {
            const keyPassword = DEFAULT_KEYPASSWORD;
            const [userKey1, userKey2, addressKey1, addressKey2] = await Promise.all([
                getKey(),
                getKey(),
                getKey(),
                getKey(),
            ]);
            const User = {
                Keys: [
                    {
                        ID: 'a',
                        PrivateKey: userKey1.privateKeyArmored,
                        Version: 2,
                    },
                    {
                        ID: 'b',
                        PrivateKey: userKey2.privateKeyArmored,
                        Version: 2,
                    },
                ],
            } as tsUser;
            const Addresses = [
                {
                    Email: 'test@test.com',
                    Keys: [
                        {
                            ID: 'c',
                            PrivateKey: addressKey1.privateKeyArmored,
                            Version: 2,
                        },
                        {
                            ID: 'd',
                            PrivateKey: addressKey2.privateKeyArmored,
                            Version: 2,
                        },
                    ],
                },
            ] as tsAddress[];
            const api = jasmine.createSpy('api').and.returnValues(Promise.resolve());
            const newKeyPassword = await upgradeV2KeysHelper({
                user: User,
                addresses: Addresses,
                loginPassword: '123',
                keyPassword,
                clearKeyPassword: keyPassword,
                isOnePasswordMode: false,
                api,
                preAuthKTVerify: () => async () => {},
                keyMigrationKTVerifier: async () => {},
            });
            expect(api.calls.all().length).toBe(1);
            if (!newKeyPassword) {
                throw new Error('Missing password');
            }
            const newKeysArgs = api.calls.all()[0].args[0];
            const decryptedKeys: PrivateKeyReference[] = await Promise.all(
                newKeysArgs.data.Keys.map(({ PrivateKey }: any) => {
                    return CryptoProxy.importPrivateKey({ armoredKey: PrivateKey, passphrase: newKeyPassword });
                })
            );
            expect(decryptedKeys.length).toBe(4);
            expect(decryptedKeys.every((key) => key.isPrivate())).toBe(true);
            expect(newKeysArgs.data.Keys[0].PrivateKey);
            expect(newKeysArgs).toEqual({
                url: 'core/v4/keys/private/upgrade',
                method: 'post',
                data: jasmine.objectContaining({
                    KeySalt: jasmine.any(String),
                    Keys: jasmine.any(Array),
                }),
            });
            expect(newKeyPassword).toEqual(jasmine.any(String));
        });

        it('should upgrade v2 and v3 keys mixed', async () => {
            const keyPassword = DEFAULT_KEYPASSWORD;
            const [userKey1, userKey2, addressKey1, addressKey2] = await Promise.all([
                getKey(),
                getKey(),
                getKey(),
                getKey(),
            ]);
            const User = {
                Keys: [
                    {
                        ID: 'a',
                        PrivateKey: userKey1.privateKeyArmored,
                        Version: 3,
                    },
                    {
                        ID: 'b',
                        PrivateKey: userKey2.privateKeyArmored,
                        Version: 2,
                    },
                ],
            } as tsUser;
            const Addresses = [
                {
                    Email: 'test@test.com',
                    Keys: [
                        {
                            ID: 'c',
                            PrivateKey: addressKey1.privateKeyArmored,
                            Version: 3,
                        },
                        {
                            ID: 'd',
                            PrivateKey: addressKey2.privateKeyArmored,
                            Version: 2,
                        },
                    ],
                },
            ] as tsAddress[];
            const api = jasmine.createSpy('api').and.returnValues(Promise.resolve());
            const newKeyPassword = await upgradeV2KeysHelper({
                user: User,
                addresses: Addresses,
                loginPassword: '123',
                keyPassword,
                clearKeyPassword: keyPassword,
                isOnePasswordMode: false,
                api,
                preAuthKTVerify: () => async () => {},
                keyMigrationKTVerifier: async () => {},
            });
            if (!newKeyPassword) {
                throw new Error('Missing password');
            }
            expect(api.calls.all().length).toBe(1);
            const newKeysArgs = api.calls.all()[0].args[0];
            const decryptedKeys: PrivateKeyReference[] = await Promise.all(
                newKeysArgs.data.Keys.map(({ PrivateKey }: any) => {
                    return CryptoProxy.importPrivateKey({ armoredKey: PrivateKey, passphrase: newKeyPassword });
                })
            );
            expect(decryptedKeys.length).toBe(4);
            expect(decryptedKeys.every((key) => key.isPrivate())).toBe(true);
            expect(newKeysArgs.data.Keys[0].PrivateKey);
            expect(newKeysArgs).toEqual({
                url: 'core/v4/keys/private/upgrade',
                method: 'post',
                data: jasmine.objectContaining({
                    KeySalt: jasmine.any(String),
                    Keys: jasmine.any(Array),
                }),
            });
            expect(newKeyPassword).toEqual(jasmine.any(String));
        });
    });

    describe('do not upgrade', () => {
        it('should not upgrade if the v2 keys cannot be decrypted', async () => {
            const email = 'test@test.com';
            const keyPassword = '1';
            const [userKey1, addressKey1, addressKey2] = await Promise.all([
                getKey(),
                getKey(),
                getKey('test@test.com', '123'),
            ]);
            const User = {
                Keys: [
                    {
                        ID: 'a',
                        PrivateKey: userKey1.privateKeyArmored,
                        Version: 3,
                    },
                ],
            } as tsUser;
            const Addresses = [
                {
                    Email: email,
                    Keys: [
                        {
                            ID: 'b',
                            PrivateKey: addressKey1.privateKeyArmored,
                            Version: 3,
                        },
                        {
                            ID: 'c',
                            PrivateKey: addressKey2.privateKeyArmored,
                            Version: 2,
                        },
                    ],
                },
            ] as tsAddress[];
            const api = jasmine.createSpy('api').and.returnValues(Promise.resolve());
            const newKeyPassword = await upgradeV2KeysHelper({
                user: User,
                addresses: Addresses,
                loginPassword: keyPassword,
                keyPassword,
                clearKeyPassword: keyPassword,
                isOnePasswordMode: false,
                api,
                preAuthKTVerify: () => async () => {},
                keyMigrationKTVerifier: async () => {},
            });
            expect(api.calls.all().length).toBe(0);
            expect(newKeyPassword).toBeUndefined();
        });

        it('should not upgrade if there are no v2 keys', async () => {
            const email = 'test@test.com';
            const keyPassword = '1';
            const [userKey1, addressKey1, addressKey2] = await Promise.all([getKey(), getKey(), getKey()]);
            const User = {
                Keys: [
                    {
                        ID: 'a',
                        PrivateKey: userKey1.privateKeyArmored,
                        Version: 3,
                    },
                ],
            } as tsUser;
            const Addresses = [
                {
                    Email: email,
                    Keys: [
                        {
                            ID: 'c',
                            PrivateKey: addressKey1.privateKeyArmored,
                            Version: 3,
                        },
                        {
                            ID: 'd',
                            PrivateKey: addressKey2.privateKeyArmored,
                            Version: 3,
                        },
                    ],
                },
            ] as tsAddress[];
            const api = jasmine.createSpy('api').and.returnValues(Promise.resolve({ Modulus }), Promise.resolve());
            const newKeyPassword = await upgradeV2KeysHelper({
                user: User,
                addresses: Addresses,
                loginPassword: keyPassword,
                keyPassword,
                clearKeyPassword: keyPassword,
                isOnePasswordMode: true,
                api,
                preAuthKTVerify: () => async () => {},
                keyMigrationKTVerifier: async () => {},
            });
            expect(api.calls.all().length).toBe(0);
            expect(newKeyPassword).toBeUndefined();
        });
    });
});
