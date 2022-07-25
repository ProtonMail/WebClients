import { ADDRESS_TYPE } from '@proton/shared/lib/constants';
import { Address } from '@proton/shared/lib/interfaces';

import { getSignedKeyList } from '../../lib/keys';
import { getActiveKeyObject, getActiveKeys } from '../../lib/keys/getActiveKeys';
import { getAddressKey, getUserKey } from './keyDataHelper';

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
        expect(activeKeys).toEqual([
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
        const signedKeyList = await getSignedKeyList(
            await Promise.all([
                getActiveKeyObject(addressKeysFull[0].key.privateKey, { ID: 'a', flags: 3 }),
                getActiveKeyObject(addressKeysFull[1].key.privateKey, { ID: 'b', primary: 1, flags: 3 }),
                getActiveKeyObject(addressKeysFull[2].key.privateKey, { ID: 'c', flags: 2 }),
            ])
        );
        const address = { Email: 'a@a.com' } as Address;
        const activeKeys = await getActiveKeys(address, signedKeyList, addressKeys, decryptedAddressKeys);
        expect(activeKeys).toEqual([
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
        const signedKeyList = await getSignedKeyList(
            await Promise.all([
                getActiveKeyObject(addressKeysFull[0].key.privateKey, { ID: 'a', flags: 7 }),
                getActiveKeyObject(addressKeysFull[1].key.privateKey, { ID: 'b', primary: 1, flags: 7 }),
                getActiveKeyObject(addressKeysFull[2].key.privateKey, { ID: 'c', flags: 6 }),
            ])
        );
        const address = { Email: 'a@a.com', Type: ADDRESS_TYPE.TYPE_EXTERNAL } as Address;
        const activeKeys = await getActiveKeys(address, signedKeyList, addressKeys, decryptedAddressKeys);
        expect(activeKeys).toEqual([
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
        expect(activeKeys).toEqual([
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
    });
});
