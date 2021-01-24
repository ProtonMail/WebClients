import { getAddressKey, getUserKey } from './keyDataHelper';
import { getActiveKeyObject, getActiveKeys } from '../../lib/keys/getActiveKeys';
import { getSignedKeyList } from '../../lib/keys';

describe('active keys', () => {
    it('should get active keys without a signed key list', async () => {
        const keyPassword = '123';
        const userKey = await getUserKey('123', keyPassword);
        const addressKeysFull = await Promise.all([
            getAddressKey('a', userKey.key.privateKey, 'a@a.com'),
            getAddressKey('b', userKey.key.privateKey, 'a@a.com'),
            getAddressKey('c', userKey.key.privateKey, 'a@a.com'),
        ]);
        const addressKeys = addressKeysFull.map(({ Key }) => Key);
        const decryptedAddressKeys = addressKeysFull.map(({ key }) => key);
        const activeKeys = await getActiveKeys(null, addressKeys, decryptedAddressKeys);
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
                getActiveKeyObject(addressKeysFull[0].key.privateKey, { ID: 'a' }),
                getActiveKeyObject(addressKeysFull[1].key.privateKey, { ID: 'b', primary: 1 }),
                getActiveKeyObject(addressKeysFull[2].key.privateKey, { ID: 'c', flags: 2 }),
            ])
        );
        const activeKeys = await getActiveKeys(signedKeyList, addressKeys, decryptedAddressKeys);
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
});
