import type { Unwrap, Address as tsAddress, User as tsUser } from '../../lib/interfaces';
import {
    decryptAddressKeyToken,
    getDecryptedAddressKeysHelper,
    getDecryptedUserKeysHelper,
    getEmailFromKey,
    splitKeys,
} from '../../lib/keys';
import { getAddressKeysMigrationPayload, migrateAddressKeys } from '../../lib/keys/keyMigration';
import { getLegacyAddressKey, getUserKey } from './keyDataHelper';

const DEFAULT_KEYPASSWORD = '123';

const getAddress = async (id: number, email: string, keyPassword: string, nKeys: number) => {
    const addressKeysFull = await Promise.all(
        Array.from({ length: nKeys })
            .fill(undefined)
            .map((_, i) => getLegacyAddressKey(`${email}${i}`, keyPassword, email))
    );
    return {
        ID: `AddressID${id}`,
        Email: email,
        Keys: addressKeysFull.map(({ Key }) => Key),
    } as unknown as tsAddress;
};

const getSetup1 = async () => {
    const keyPassword = DEFAULT_KEYPASSWORD;
    const OrganizationKeyFull = await getUserKey('a', keyPassword);
    const UserKeysFull = await Promise.all([getUserKey('1', keyPassword), getUserKey('2', keyPassword)]);
    const User = {
        Keys: UserKeysFull.map(({ Key }) => Key),
    } as unknown as tsUser;
    const userKeys = await getDecryptedUserKeysHelper(User, keyPassword);
    const Addresses = await Promise.all([
        getAddress(1, '1@test.com', keyPassword, 3),
        getAddress(2, '2@test.com', keyPassword, 1),
        getAddress(3, '3@test.com', keyPassword, 2),
    ]);
    const addressKeys = await Promise.all(
        Addresses.map((address) => {
            return getDecryptedAddressKeysHelper(address.Keys, User, userKeys, DEFAULT_KEYPASSWORD);
        })
    );
    return {
        organizationKey: {
            Key: {
                PrivateKey: OrganizationKeyFull.Key.PrivateKey,
                PublicKey: OrganizationKeyFull.Key.PublicKey,
            },
            key: OrganizationKeyFull.key,
        },
        User,
        Addresses,
        userKeys,
        addressKeys,
    };
};

describe('key migration', () => {
    const verifyStandard = async ({
        Addresses,
        User,
        result,
        addressKeys,
        userKeys,
    }: {
        result: Unwrap<ReturnType<typeof getAddressKeysMigrationPayload>>;
    } & Unwrap<ReturnType<typeof getSetup1>>) => {
        const decryptedMigratedKeys = await Promise.all(
            Addresses.map((address) => {
                const keys = result.AddressKeys.filter((x) => {
                    return address.Keys.some(({ ID }) => ID === x.ID);
                });
                return getDecryptedAddressKeysHelper(keys as any, User, userKeys, ''); // No longer decrypting with the old key password
            })
        );

        expect(addressKeys.flat().length).toEqual(decryptedMigratedKeys.flat().length);

        const { privateKeys, publicKeys } = splitKeys(userKeys);
        expect(
            await decryptAddressKeyToken({
                Token: result.AddressKeys[0].Token,
                Signature: result.AddressKeys[0].Signature,
                privateKeys,
                publicKeys,
            })
        ).not.toEqual(
            await decryptAddressKeyToken({
                Token: result.AddressKeys[1].Token,
                Signature: result.AddressKeys[1].Signature,
                privateKeys,
                publicKeys,
            })
        );

        decryptedMigratedKeys.forEach((keys, i) => {
            keys.forEach((key, j) => {
                expect(key.privateKey.getFingerprint()).toEqual(addressKeys[i][j].privateKey.getFingerprint());
            });
        });

        decryptedMigratedKeys.forEach((keys, i) => {
            keys.forEach((key) => {
                expect(getEmailFromKey(key.privateKey)).toEqual(Addresses[i].Email);
            });
        });
    };

    it('should migrate keys in the legacy format', async () => {
        const { User, Addresses, userKeys, addressKeys, organizationKey } = await getSetup1();

        const migratedKeys = await migrateAddressKeys({
            api: (async () => {}) as any,
            user: User,
            addresses: Addresses,
            keyPassword: DEFAULT_KEYPASSWORD,
            preAuthKTVerify: () => async () => {},
            keyMigrationKTVerifier: async () => {},
        });
        const result = await getAddressKeysMigrationPayload(migratedKeys);
        await verifyStandard({
            organizationKey,
            Addresses,
            User,
            userKeys,
            result,
            addressKeys,
        });

        expect(result.SignedKeyLists).toEqual({
            [Addresses[0].ID]: {
                Data: jasmine.any(String),
                Signature: jasmine.any(String),
            },
            [Addresses[1].ID]: {
                Data: jasmine.any(String),
                Signature: jasmine.any(String),
            },
            [Addresses[2].ID]: {
                Data: jasmine.any(String),
                Signature: jasmine.any(String),
            },
        });

        // @ts-ignore
        expect(result.AddressKeys[0].OrgSignature).not.toBeDefined();
    });

    it('should migrate keys in the legacy format where some addresses are missing keys', async () => {
        const { User, Addresses, userKeys, addressKeys, organizationKey } = await getSetup1();

        Addresses[2].Keys.length = 0;
        addressKeys[2].length = 0;

        const migratedKeys = await migrateAddressKeys({
            api: (async () => {}) as any,
            user: User,
            addresses: Addresses,
            keyPassword: DEFAULT_KEYPASSWORD,
            preAuthKTVerify: () => async () => {},
            keyMigrationKTVerifier: async () => {},
        });
        const result = await getAddressKeysMigrationPayload(migratedKeys);
        await verifyStandard({
            organizationKey,
            Addresses,
            User,
            userKeys,
            result,
            addressKeys,
        });

        expect(result.SignedKeyLists).toEqual({
            [Addresses[0].ID]: {
                Data: jasmine.any(String),
                Signature: jasmine.any(String),
            },
            [Addresses[1].ID]: {
                Data: jasmine.any(String),
                Signature: jasmine.any(String),
            },
        });

        // @ts-ignore
        expect(result.AddressKeys[0].OrgSignature).not.toBeDefined();
    });

    it('should migrate keys in the legacy format with organization signatures', async () => {
        const { User, Addresses, userKeys, addressKeys, organizationKey } = await getSetup1();

        const migratedKeys = await migrateAddressKeys({
            api: (async () => {}) as any,
            user: User,
            addresses: Addresses,
            organizationKey: organizationKey.Key,
            keyPassword: DEFAULT_KEYPASSWORD,
            preAuthKTVerify: () => async () => {},
            keyMigrationKTVerifier: async () => {},
        });
        const result = await getAddressKeysMigrationPayload(migratedKeys);
        await verifyStandard({
            organizationKey,
            Addresses,
            User,
            userKeys,
            result,
            addressKeys,
        });

        expect(result.SignedKeyLists).toEqual({
            [Addresses[0].ID]: {
                Data: jasmine.any(String),
                Signature: jasmine.any(String),
            },
            [Addresses[1].ID]: {
                Data: jasmine.any(String),
                Signature: jasmine.any(String),
            },
            [Addresses[2].ID]: {
                Data: jasmine.any(String),
                Signature: jasmine.any(String),
            },
        });

        const { privateKeys } = splitKeys(userKeys);

        expect(result.AddressKeys[0].OrgSignature).toEqual(jasmine.stringMatching(/^-----BEGIN PGP SIGNA/));

        expect(
            await decryptAddressKeyToken({
                Token: result.AddressKeys[0].Token,
                Signature: result.AddressKeys[0].OrgSignature,
                privateKeys,
                publicKeys: [organizationKey.key.privateKey],
            })
        ).toEqual(jasmine.stringMatching(/[a-z\d]+/));
    });
});
