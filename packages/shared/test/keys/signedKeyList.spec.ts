import { ADDRESS_TYPE, KEYGEN_CONFIGS, KEYGEN_TYPES } from '@proton/shared/lib/constants';
import type { Address } from '@proton/shared/lib/interfaces';

import { getSignedKeyList } from '../../lib/keys';
import { getActiveAddressKeys, getActiveKeyObject } from '../../lib/keys/getActiveKeys';
import { getAddressKey, getAddressKeyForE2EEForwarding, getAddressKeyHelper, getUserKey } from './keyDataHelper';

describe('active keys', () => {
    it('should get active keys without a signed key list', async () => {
        const keyPassword = '123';
        const userKey = await getUserKey('123', keyPassword);
        const addressKeysFull = await Promise.all([
            getAddressKey('a', userKey.key.privateKey, 'a@a.com', true),
            getAddressKey('b', userKey.key.privateKey, 'a@a.com'),
            getAddressKey('c', userKey.key.privateKey, 'a@a.com'),
        ]);
        const decryptedAddressKeys = addressKeysFull.map(({ key, Key: { Primary, Flags } }) => ({
            ...key,
            Primary,
            Flags: Flags!,
        }));
        const activeKeys = await getActiveAddressKeys(null, decryptedAddressKeys);
        expect(activeKeys.v4).toEqual([
            {
                ID: 'a',
                primary: 1,
                flags: 3,
                privateKey: jasmine.any(Object),
                publicKey: jasmine.any(Object),
                fingerprint: jasmine.any(String),
                sha256Fingerprints: jasmine.any(Array),
            },
            {
                ID: 'b',
                primary: 0,
                flags: 3,
                privateKey: jasmine.any(Object),
                publicKey: jasmine.any(Object),
                fingerprint: jasmine.any(String),
                sha256Fingerprints: jasmine.any(Array),
            },
            {
                ID: 'c',
                primary: 0,
                flags: 3,
                privateKey: jasmine.any(Object),
                publicKey: jasmine.any(Object),
                fingerprint: jasmine.any(String),
                sha256Fingerprints: jasmine.any(Array),
            },
        ]);
        expect(activeKeys.v6).toEqual([]);
    });

    it('should get active keys with a signed key list', async () => {
        const keyPassword = '123';
        const userKey = await getUserKey('123', keyPassword);
        const someAddressKeys = await Promise.all([
            getAddressKey('a', userKey.key.privateKey, 'a@a.com'),
            getAddressKey('b', userKey.key.privateKey, 'a@a.com'),
            getAddressKey('c', userKey.key.privateKey, 'a@a.com'),
        ]);
        const addressKeysFull = [
            ...someAddressKeys,
            // there exist some old users that have duplicate keys (exact same key material, different DB entries), hence we test this edge-case
            await getAddressKeyHelper('d', userKey.key.privateKey, someAddressKeys[0].key.privateKey),
            await getAddressKeyHelper('e', userKey.key.privateKey, someAddressKeys[0].key.privateKey),
        ];
        const decryptedAddressKeys = addressKeysFull.map(({ key, Key: { Primary, Flags } }) => ({
            ...key,
            Primary,
            Flags: Flags!,
        }));
        const signedKeyList = await getSignedKeyList(
            {
                v4: await Promise.all([
                    getActiveKeyObject(addressKeysFull[0].key.privateKey, addressKeysFull[0].key.publicKey, {
                        ID: 'a',
                        flags: 3,
                    }),
                    getActiveKeyObject(addressKeysFull[1].key.privateKey, addressKeysFull[1].key.publicKey, {
                        ID: 'b',
                        primary: 1,
                        flags: 3,
                    }),
                    getActiveKeyObject(addressKeysFull[2].key.privateKey, addressKeysFull[2].key.publicKey, {
                        ID: 'c',
                        flags: 2,
                    }),
                    getActiveKeyObject(addressKeysFull[3].key.privateKey, addressKeysFull[3].key.publicKey, {
                        ID: 'd',
                        primary: 0,
                        flags: 3,
                    }),
                    getActiveKeyObject(addressKeysFull[4].key.privateKey, addressKeysFull[4].key.publicKey, {
                        ID: 'e',
                        primary: 0,
                        flags: 0,
                    }),
                ]),
                v6: [],
            },
            {
                ID: 'a',
                Email: 'a@a.com',
            } as unknown as Address,
            async () => {}
        );
        const activeKeys = await getActiveAddressKeys(signedKeyList, decryptedAddressKeys);
        expect(activeKeys.v4).toEqual([
            {
                ID: 'a',
                primary: 0,
                flags: 3,
                privateKey: jasmine.any(Object),
                publicKey: jasmine.any(Object),
                fingerprint: jasmine.any(String),
                sha256Fingerprints: jasmine.any(Array),
            },
            {
                ID: 'b',
                primary: 1,
                flags: 3,
                privateKey: jasmine.any(Object),
                publicKey: jasmine.any(Object),
                fingerprint: jasmine.any(String),
                sha256Fingerprints: jasmine.any(Array),
            },
            {
                ID: 'c',
                primary: 0,
                flags: 2,
                privateKey: jasmine.any(Object),
                publicKey: jasmine.any(Object),
                fingerprint: jasmine.any(String),
                sha256Fingerprints: jasmine.any(Array),
            },
            {
                ID: 'd',
                primary: 0,
                flags: 3,
                privateKey: jasmine.any(Object),
                publicKey: jasmine.any(Object),
                fingerprint: jasmine.any(String),
                sha256Fingerprints: jasmine.any(Array),
            },
            {
                ID: 'e',
                primary: 0,
                flags: 0,
                privateKey: jasmine.any(Object),
                publicKey: jasmine.any(Object),
                fingerprint: jasmine.any(String),
                sha256Fingerprints: jasmine.any(Array),
            },
        ]);
        expect(activeKeys.v6).toEqual([]);
    });

    it('should get active keys with a signed key list for external keys', async () => {
        const keyPassword = '123';
        const userKey = await getUserKey('123', keyPassword);
        const addressKeysFull = await Promise.all([
            getAddressKey('a', userKey.key.privateKey, 'a@a.com'),
            getAddressKey('b', userKey.key.privateKey, 'a@a.com'),
            getAddressKey('c', userKey.key.privateKey, 'a@a.com'),
        ]);
        const address = { Email: 'a@a.com', Type: ADDRESS_TYPE.TYPE_EXTERNAL } as Address;
        const decryptedAddressKeys = addressKeysFull.map(({ key, Key: { Primary, Flags } }) => ({
            ...key,
            Primary,
            Flags: Flags!,
        }));
        const signedKeyList = await getSignedKeyList(
            {
                v4: await Promise.all([
                    getActiveKeyObject(addressKeysFull[0].key.privateKey, addressKeysFull[0].key.publicKey, {
                        ID: 'a',
                        flags: 7,
                    }),
                    getActiveKeyObject(addressKeysFull[1].key.privateKey, addressKeysFull[1].key.publicKey, {
                        ID: 'b',
                        primary: 1,
                        flags: 7,
                    }),
                    getActiveKeyObject(addressKeysFull[2].key.privateKey, addressKeysFull[2].key.publicKey, {
                        ID: 'c',
                        flags: 6,
                    }),
                ]),
                v6: [],
            },
            address,
            async () => {}
        );
        const activeKeys = await getActiveAddressKeys(signedKeyList, decryptedAddressKeys);
        expect(activeKeys.v4).toEqual([
            {
                ID: 'a',
                primary: 0,
                flags: 7,
                privateKey: jasmine.any(Object),
                publicKey: jasmine.any(Object),
                fingerprint: jasmine.any(String),
                sha256Fingerprints: jasmine.any(Array),
            },
            {
                ID: 'b',
                primary: 1,
                flags: 7,
                privateKey: jasmine.any(Object),
                publicKey: jasmine.any(Object),
                fingerprint: jasmine.any(String),
                sha256Fingerprints: jasmine.any(Array),
            },
            {
                ID: 'c',
                primary: 0,
                flags: 6,
                privateKey: jasmine.any(Object),
                publicKey: jasmine.any(Object),
                fingerprint: jasmine.any(String),
                sha256Fingerprints: jasmine.any(Array),
            },
        ]);
        expect(activeKeys.v6).toEqual([]);
    });

    it('should should fall back to key flags when no signed key list exists', async () => {
        const keyPassword = '123';
        const userKey = await getUserKey('123', keyPassword);
        const addressKeysFull = await Promise.all([
            getAddressKey('a', userKey.key.privateKey, 'a@a.com'),
            getAddressKey('b', userKey.key.privateKey, 'a@a.com'),
            getAddressKey('c', userKey.key.privateKey, 'a@a.com'),
        ]);
        addressKeysFull[2].Key.Flags = 1;
        addressKeysFull[0].Key.Primary = 1;
        addressKeysFull[1].Key.Primary = 0;
        addressKeysFull[2].Key.Primary = 0;
        const decryptedAddressKeys = addressKeysFull.map(({ key, Key: { Primary, Flags } }) => ({
            ...key,
            Primary,
            Flags: Flags!,
        }));
        const activeKeys = await getActiveAddressKeys(undefined, decryptedAddressKeys);
        expect(activeKeys.v4).toEqual([
            {
                ID: 'a',
                primary: 1,
                flags: 3,
                privateKey: jasmine.any(Object),
                publicKey: jasmine.any(Object),
                fingerprint: jasmine.any(String),
                sha256Fingerprints: jasmine.any(Array),
            },
            {
                ID: 'b',
                primary: 0,
                flags: 3,
                privateKey: jasmine.any(Object),
                publicKey: jasmine.any(Object),
                fingerprint: jasmine.any(String),
                sha256Fingerprints: jasmine.any(Array),
            },
            {
                ID: 'c',
                primary: 0,
                flags: 1,
                privateKey: jasmine.any(Object),
                publicKey: jasmine.any(Object),
                fingerprint: jasmine.any(String),
                sha256Fingerprints: jasmine.any(Array),
            },
        ]);
        expect(activeKeys.v6).toEqual([]);
    });

    it('should include forwarding keys', async () => {
        const keyPassword = '123';
        const userKey = await getUserKey('123', keyPassword);
        const addressKeysFull = await Promise.all([
            getAddressKey('a', userKey.key.privateKey, 'a@a.com', true),
            getAddressKeyForE2EEForwarding('b', userKey.key.privateKey, 'a@a.com'),
            getAddressKey('c', userKey.key.privateKey, 'a@a.com'),
        ]);
        const decryptedAddressKeys = addressKeysFull.map(({ key, Key: { Primary, Flags } }) => ({
            ...key,
            Primary,
            Flags: Flags!,
        }));
        const address = { Email: 'a@a.com', Type: ADDRESS_TYPE.TYPE_ORIGINAL } as Address;
        const signedKeyList = await getSignedKeyList(
            {
                v4: await Promise.all([
                    getActiveKeyObject(addressKeysFull[0].key.privateKey, addressKeysFull[0].key.publicKey, {
                        ID: 'a',
                        primary: 1,
                        flags: 3,
                    }),
                    getActiveKeyObject(addressKeysFull[1].key.privateKey, addressKeysFull[1].key.publicKey, {
                        ID: 'b',
                        flags: 3,
                    }),
                    getActiveKeyObject(addressKeysFull[2].key.privateKey, addressKeysFull[2].key.publicKey, {
                        ID: 'c',
                        flags: 3,
                    }),
                ]),
                v6: [],
            },
            address,
            async () => {}
        );

        // ensure that forwarding keys are not included in the SKL
        const signedKeys = JSON.parse(signedKeyList.Data);
        expect(signedKeys.length).toEqual(2);
        expect(signedKeys[0].Fingerprint).toEqual(addressKeysFull[0].key.privateKey.getFingerprint());
        expect(signedKeys[1].Fingerprint).toEqual(addressKeysFull[2].key.privateKey.getFingerprint());

        const activeKeys = await getActiveAddressKeys(signedKeyList, decryptedAddressKeys);
        expect(activeKeys.v4).toEqual([
            {
                ID: 'a',
                primary: 1,
                flags: 3,
                privateKey: jasmine.any(Object),
                publicKey: jasmine.any(Object),
                fingerprint: jasmine.any(String),
                sha256Fingerprints: jasmine.any(Array),
            },
            {
                ID: 'b',
                primary: 0,
                flags: 3,
                privateKey: jasmine.any(Object),
                publicKey: jasmine.any(Object),
                fingerprint: jasmine.any(String),
                sha256Fingerprints: jasmine.any(Array),
            },
            {
                ID: 'c',
                primary: 0,
                flags: 3,
                privateKey: jasmine.any(Object),
                publicKey: jasmine.any(Object),
                fingerprint: jasmine.any(String),
                sha256Fingerprints: jasmine.any(Array),
            },
        ]);
        expect(activeKeys.v6).toEqual([]);
    });

    it('should support two primary keys as long as they are v4 and v6', async () => {
        const keyPassword = '123';
        const userKey = await getUserKey('123', keyPassword, undefined, KEYGEN_CONFIGS[KEYGEN_TYPES.PQC]);
        const addressKeysFull = await Promise.all([
            getAddressKey('a', userKey.key.privateKey, 'a@a.com', true),
            getAddressKey('b', userKey.key.privateKey, 'a@a.com', true, undefined, KEYGEN_CONFIGS[KEYGEN_TYPES.PQC]),
            getAddressKey('c', userKey.key.privateKey, 'a@a.com'),
        ]);
        const decryptedAddressKeys = addressKeysFull.map(({ key, Key: { Primary, Flags } }) => ({
            ...key,
            Primary,
            Flags: Flags!,
        }));
        const address = { Email: 'a@a.com', Type: ADDRESS_TYPE.TYPE_ORIGINAL } as Address;

        // guard against multiple primary keys with the same version (v4)
        await expectAsync(
            getSignedKeyList(
                {
                    v4: await Promise.all([
                        getActiveKeyObject(addressKeysFull[0].key.privateKey, addressKeysFull[0].key.publicKey, {
                            ID: 'a',
                            primary: 1,
                            flags: 3,
                        }),
                        getActiveKeyObject(addressKeysFull[2].key.privateKey, addressKeysFull[2].key.publicKey, {
                            ID: 'c',
                            primary: 1,
                            flags: 3,
                        }),
                    ]),
                    v6: await Promise.all([
                        getActiveKeyObject(addressKeysFull[1].key.privateKey, addressKeysFull[1].key.publicKey, {
                            ID: 'b',
                            flags: 3,
                        }),
                    ]),
                },
                address,
                async () => {}
            )
        ).toBeRejectedWithError(/Unexpected number of primary keys/);

        // guard against more than one v4 primary key
        await expectAsync(
            getSignedKeyList(
                {
                    v4: await Promise.all([
                        getActiveKeyObject(addressKeysFull[0].key.privateKey, addressKeysFull[0].key.publicKey, {
                            ID: 'a',
                            primary: 1,
                            flags: 3,
                        }),

                        getActiveKeyObject(addressKeysFull[2].key.privateKey, addressKeysFull[2].key.publicKey, {
                            ID: 'c',
                            primary: 1,
                            flags: 3,
                        }),
                    ]),
                    v6: await Promise.all([
                        getActiveKeyObject(addressKeysFull[1].key.privateKey, addressKeysFull[1].key.publicKey, {
                            ID: 'b',
                            flags: 3,
                        }),
                    ]),
                },
                address,
                async () => {}
            )
        ).toBeRejectedWithError(/Unexpected number of primary keys/);

        // guard against standalone primary v6 key
        await expectAsync(
            getSignedKeyList(
                {
                    v4: await Promise.all([
                        getActiveKeyObject(addressKeysFull[0].key.privateKey, addressKeysFull[0].key.publicKey, {
                            ID: 'a',
                            flags: 3,
                        }),
                        getActiveKeyObject(addressKeysFull[2].key.privateKey, addressKeysFull[2].key.publicKey, {
                            ID: 'c',
                            flags: 3,
                        }),
                    ]),
                    v6: await Promise.all([
                        getActiveKeyObject(addressKeysFull[1].key.privateKey, addressKeysFull[1].key.publicKey, {
                            ID: 'b',
                            primary: 1,
                            flags: 3,
                        }),
                    ]),
                },
                address,
                async () => {}
            )
        ).toBeRejectedWithError(/Unexpected number of primary keys/);

        // one primary v4 and v6 key is allowed
        const signedKeyList = await getSignedKeyList(
            {
                v4: await Promise.all([
                    getActiveKeyObject(addressKeysFull[0].key.privateKey, addressKeysFull[0].key.publicKey, {
                        ID: 'a',
                        primary: 1,
                        flags: 3,
                    }),
                    getActiveKeyObject(addressKeysFull[2].key.privateKey, addressKeysFull[2].key.publicKey, {
                        ID: 'c',
                        flags: 3,
                    }),
                ]),
                v6: await Promise.all([
                    getActiveKeyObject(addressKeysFull[1].key.privateKey, addressKeysFull[1].key.publicKey, {
                        ID: 'b',
                        primary: 1,
                        flags: 3,
                    }),
                ]),
            },
            address,
            async () => {}
        );

        const signedKeys = JSON.parse(signedKeyList.Data);
        expect(signedKeys.length).toEqual(3);
        expect(signedKeys[0].Fingerprint).toEqual(addressKeysFull[0].key.privateKey.getFingerprint());
        expect(signedKeys[1].Fingerprint).toEqual(addressKeysFull[1].key.privateKey.getFingerprint());
        expect(signedKeys[2].Fingerprint).toEqual(addressKeysFull[2].key.privateKey.getFingerprint());

        const activeKeys = await getActiveAddressKeys(signedKeyList, decryptedAddressKeys);
        expect(activeKeys.v4).toEqual([
            {
                ID: 'a',
                primary: 1,
                flags: 3,
                privateKey: jasmine.any(Object),
                publicKey: jasmine.any(Object),
                fingerprint: jasmine.any(String),
                sha256Fingerprints: jasmine.any(Array),
            },
            {
                ID: 'c',
                primary: 0,
                flags: 3,
                privateKey: jasmine.any(Object),
                publicKey: jasmine.any(Object),
                fingerprint: jasmine.any(String),
                sha256Fingerprints: jasmine.any(Array),
            },
        ]);
        expect(activeKeys.v6).toEqual([
            {
                ID: 'b',
                primary: 1,
                flags: 3,
                privateKey: jasmine.any(Object),
                publicKey: jasmine.any(Object),
                fingerprint: jasmine.any(String),
                sha256Fingerprints: jasmine.any(Array),
            },
        ]);
    });
});
