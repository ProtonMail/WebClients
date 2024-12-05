import { ADDRESS_TYPE, KEYGEN_CONFIGS, KEYGEN_TYPES } from '@proton/shared/lib/constants';
import type { Address } from '@proton/shared/lib/interfaces';

import { getSignedKeyList } from '../../lib/keys';
import { getActiveKeyObject, getActiveKeys } from '../../lib/keys/getActiveKeys';
import { getAddressKey, getAddressKeyForE2EEForwarding, getUserKey } from './keyDataHelper';

describe('active keys', () => {
    it('should get active keys without a signed key list', async () => {
        const keyPassword = '123';
        const userKey = await getUserKey('123', keyPassword);
        const addressKeysFull = await Promise.all([
            getAddressKey('a', userKey.key.privateKey, 'a@a.com'),
            getAddressKey('b', userKey.key.privateKey, 'a@a.com'),
            getAddressKey('c', userKey.key.privateKey, 'a@a.com'),
        ]);
        const address = { Email: 'a@a.com' } as Address;
        const addressKeys = addressKeysFull.map(({ Key }) => Key);
        const decryptedAddressKeys = addressKeysFull.map(({ key }) => key);
        const activeKeys = await getActiveKeys(address, null, addressKeys, decryptedAddressKeys);
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
        const addressKeysFull = await Promise.all([
            getAddressKey('a', userKey.key.privateKey, 'a@a.com'),
            getAddressKey('b', userKey.key.privateKey, 'a@a.com'),
            getAddressKey('c', userKey.key.privateKey, 'a@a.com'),
        ]);
        const addressKeys = addressKeysFull.map(({ Key }) => Key);
        const decryptedAddressKeys = addressKeysFull.map(({ key }) => key);
        const signedKeyList = await getSignedKeyList({
                v4: await Promise.all([
                    getActiveKeyObject(addressKeysFull[0].key.privateKey, { ID: 'a', flags: 3 }),
                    getActiveKeyObject(addressKeysFull[1].key.privateKey, { ID: 'b', primary: 1, flags: 3 }),
                    getActiveKeyObject(addressKeysFull[2].key.privateKey, { ID: 'c', flags: 2 }),
                ]),
                v6: []
            },
            {
                ID: 'a',
                Email: 'a@a.com',
            } as unknown as Address,
            async () => {}
        );
        const address = { Email: 'a@a.com' } as Address;
        const activeKeys = await getActiveKeys(address, signedKeyList, addressKeys, decryptedAddressKeys);
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
        const addressKeys = addressKeysFull.map(({ Key }) => Key);
        const decryptedAddressKeys = addressKeysFull.map(({ key }) => key);
        const address = { Email: 'a@a.com', Type: ADDRESS_TYPE.TYPE_EXTERNAL } as Address;
        const signedKeyList = await getSignedKeyList({
                v4: await Promise.all([
                    getActiveKeyObject(addressKeysFull[0].key.privateKey, { ID: 'a', flags: 7 }),
                    getActiveKeyObject(addressKeysFull[1].key.privateKey, { ID: 'b', primary: 1, flags: 7 }),
                    getActiveKeyObject(addressKeysFull[2].key.privateKey, { ID: 'c', flags: 6 }),
                ]),
                v6: []
            },
            address,
            async () => {}
        );
        const activeKeys = await getActiveKeys(address, signedKeyList, addressKeys, decryptedAddressKeys);
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
        const addressKeys = addressKeysFull.map(({ Key }) => Key);
        const decryptedAddressKeys = addressKeysFull.map(({ key }) => key);
        const activeKeys = await getActiveKeys(undefined, undefined, addressKeys, decryptedAddressKeys);
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
            getAddressKey('a', userKey.key.privateKey, 'a@a.com'),
            getAddressKeyForE2EEForwarding('b', userKey.key.privateKey, 'a@a.com'),
            getAddressKey('c', userKey.key.privateKey, 'a@a.com'),
        ]);
        const addressKeys = addressKeysFull.map(({ Key }) => Key);
        const decryptedAddressKeys = addressKeysFull.map(({ key }) => key);
        const address = { Email: 'a@a.com', Type: ADDRESS_TYPE.TYPE_ORIGINAL } as Address;
        const signedKeyList = await getSignedKeyList({
                v4: await Promise.all([
                        getActiveKeyObject(addressKeysFull[0].key.privateKey, { ID: 'a', primary: 1, flags: 3 }),
                        getActiveKeyObject(addressKeysFull[1].key.privateKey, { ID: 'b', flags: 3 }),
                        getActiveKeyObject(addressKeysFull[2].key.privateKey, { ID: 'c', flags: 3 }),
                    ]),
                v6: []
            },
            address,
            async () => {}
        );

        // ensure that forwarding keys are not included in the SKL
        const signedKeys = JSON.parse(signedKeyList.Data);
        expect(signedKeys.length).toEqual(2);
        expect(signedKeys[0].Fingerprint).toEqual(addressKeysFull[0].key.privateKey.getFingerprint());
        expect(signedKeys[1].Fingerprint).toEqual(addressKeysFull[2].key.privateKey.getFingerprint());

        const activeKeys = await getActiveKeys(address, signedKeyList, addressKeys, decryptedAddressKeys);
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
            getAddressKey('a', userKey.key.privateKey, 'a@a.com'),
            getAddressKey('b', userKey.key.privateKey, 'a@a.com', undefined, KEYGEN_CONFIGS[KEYGEN_TYPES.PQC]),
            getAddressKey('c', userKey.key.privateKey, 'a@a.com'),
        ]);
        const addressKeys = addressKeysFull.map(({ Key }) => Key);
        const decryptedAddressKeys = addressKeysFull.map(({ key }) => key);
        const address = { Email: 'a@a.com', Type: ADDRESS_TYPE.TYPE_ORIGINAL } as Address;

        // guard against multiple primary keys with the same version (v4)
        await expectAsync(
            getSignedKeyList({
                    v4: await Promise.all([
                        getActiveKeyObject(addressKeysFull[0].key.privateKey, { ID: 'a', primary: 1, flags: 3 }),
                        getActiveKeyObject(addressKeysFull[2].key.privateKey, { ID: 'c', primary: 1, flags: 3 }),
                    ]),
                    v6: await Promise.all([
                        getActiveKeyObject(addressKeysFull[1].key.privateKey, { ID: 'b', flags: 3 }),
                    ])
                },
                address,
                async () => {}
            )
        ).toBeRejectedWithError(/Unexpected number of primary keys/);

        // guard against more than one v4 primary key
        await expectAsync(
            getSignedKeyList({
                    v4: await Promise.all([
                        getActiveKeyObject(addressKeysFull[0].key.privateKey, { ID: 'a', primary: 1, flags: 3 }),

                        getActiveKeyObject(addressKeysFull[2].key.privateKey, { ID: 'c', primary: 1, flags: 3 }),
                    ]),
                    v6: await Promise.all([
                        getActiveKeyObject(addressKeysFull[1].key.privateKey, { ID: 'b', flags: 3 }),
                    ])
                },
                address,
                async () => {}
            )
        ).toBeRejectedWithError(/Unexpected number of primary keys/);

        // guard against standalone primary v6 key
        await expectAsync(
            getSignedKeyList({
                    v4: await Promise.all([
                        getActiveKeyObject(addressKeysFull[0].key.privateKey, { ID: 'a', flags: 3 }),
                        getActiveKeyObject(addressKeysFull[2].key.privateKey, { ID: 'c', flags: 3 }),
                    ]),
                    v6: await Promise.all([
                        getActiveKeyObject(addressKeysFull[1].key.privateKey, { ID: 'b', primary: 1, flags: 3 }),
                    ])
                },
                address,
                async () => {}
            )
        ).toBeRejectedWithError(/Unexpected number of primary keys/);

        // one primary v4 and v6 key is allowed
        const signedKeyList = await getSignedKeyList({
                v4: await Promise.all([
                    getActiveKeyObject(addressKeysFull[0].key.privateKey, { ID: 'a', primary: 1, flags: 3 }),
                    getActiveKeyObject(addressKeysFull[2].key.privateKey, { ID: 'c', flags: 3 }),
                ]),
                v6: await Promise.all([
                    getActiveKeyObject(addressKeysFull[1].key.privateKey, { ID: 'b', primary: 1, flags: 3 }),
                ])
            },
            address,
            async () => {}
        );

        const signedKeys = JSON.parse(signedKeyList.Data);
        expect(signedKeys.length).toEqual(3);
        expect(signedKeys[0].Fingerprint).toEqual(addressKeysFull[0].key.privateKey.getFingerprint());
        expect(signedKeys[1].Fingerprint).toEqual(addressKeysFull[1].key.privateKey.getFingerprint());
        expect(signedKeys[2].Fingerprint).toEqual(addressKeysFull[2].key.privateKey.getFingerprint());

        const activeKeys = await getActiveKeys(address, signedKeyList, addressKeys, decryptedAddressKeys);
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
        ])
    });
});
