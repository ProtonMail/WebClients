import { decryptPrivateKey, generateKey } from 'pmcrypto';
import { upgradeV2KeysHelper } from '../../lib/keys/upgradeKeysV2';
import { Modulus } from '../authentication/login.data';
import { User as tsUser, Address as tsAddress } from '../../lib/interfaces';
import { getDecryptedAddressKeys, getDecryptedUserKeys } from '../../lib/keys';

const DEFAULT_EMAIL = 'test@test.com';
const DEFAULT_KEYPASSWORD = '1';

const getKey = (email = DEFAULT_EMAIL, keyPassword = DEFAULT_KEYPASSWORD) => {
    return generateKey({
        userIds: [{ name: email, email }],
        passphrase: keyPassword,
        curve: 'ed25519',
    });
};

describe('upgrade keys v2', () => {
    describe('do v2 upgrade', () => {
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
                hasAddressKeyMigration: true,
            });
            if (!newKeyPassword) {
                throw new Error('Missing new password');
            }
            expect(api.calls.all().length).toBe(2);
            const newKeysArgs = api.calls.all()[1].args[0];
            const decryptedUserKeys = await getDecryptedUserKeys({
                user: User,
                userKeys: newKeysArgs.data.UserKeys,
                keyPassword: newKeyPassword,
            });
            const decryptedAddressesKeys = await getDecryptedAddressKeys({
                address: Addresses[0],
                addressKeys: newKeysArgs.data.AddressKeys,
                user: User,
                userKeys: decryptedUserKeys,
                keyPassword: '',
            });
            expect(decryptedUserKeys.every((key) => key.privateKey.isDecrypted())).toBe(true);
            expect(decryptedUserKeys.length).toBe(2 as any);
            expect(decryptedAddressesKeys.every((key) => key.privateKey.isDecrypted())).toBe(true);
            expect(decryptedAddressesKeys.length).toBe(3 as any);
            expect(newKeysArgs).toEqual({
                url: 'keys/private/upgrade',
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
                hasAddressKeyMigration: false,
            });
            if (!newKeyPassword) {
                throw new Error('Missing new password');
            }
            expect(api.calls.all().length).toBe(2);
            const newKeysArgs = api.calls.all()[1].args[0];
            const decryptedKeys = await Promise.all(
                newKeysArgs.data.Keys.map(({ PrivateKey }: any) => {
                    return decryptPrivateKey(PrivateKey, newKeyPassword);
                })
            );
            expect(decryptedKeys.every((key: any) => key.isDecrypted())).toBe(true);
            expect(decryptedKeys.length).toBe(5 as any);
            expect(newKeysArgs.data.Keys[0].PrivateKey);
            expect(newKeysArgs).toEqual({
                url: 'keys/private/upgrade',
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
                hasAddressKeyMigration: false,
            });
            expect(api.calls.all().length).toBe(1);
            if (!newKeyPassword) {
                throw new Error('Missing password');
            }
            const newKeysArgs = api.calls.all()[0].args[0];
            const decryptedKeys = await Promise.all(
                newKeysArgs.data.Keys.map(({ PrivateKey }: any) => {
                    return decryptPrivateKey(PrivateKey, newKeyPassword);
                })
            );
            expect(decryptedKeys.length).toBe(4 as any);
            expect(decryptedKeys.every((key: any) => key.isDecrypted())).toBe(true);
            expect(newKeysArgs.data.Keys[0].PrivateKey);
            expect(newKeysArgs).toEqual({
                url: 'keys/private/upgrade',
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
                hasAddressKeyMigration: false,
            });
            if (!newKeyPassword) {
                throw new Error('Missing password');
            }
            expect(api.calls.all().length).toBe(1);
            const newKeysArgs = api.calls.all()[0].args[0];
            const decryptedKeys = await Promise.all(
                newKeysArgs.data.Keys.map(({ PrivateKey }: any) => {
                    return decryptPrivateKey(PrivateKey, newKeyPassword);
                })
            );
            expect(decryptedKeys.length).toBe(4 as any);
            expect(decryptedKeys.every((key: any) => key.isDecrypted())).toBe(true);
            expect(newKeysArgs.data.Keys[0].PrivateKey);
            expect(newKeysArgs).toEqual({
                url: 'keys/private/upgrade',
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
                hasAddressKeyMigration: false,
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
                hasAddressKeyMigration: false,
            });
            expect(api.calls.all().length).toBe(0);
            expect(newKeyPassword).toBeUndefined();
        });
    });
});
