import { DecryptedAddressKey, DecryptedKey, User } from '@proton/shared/lib/interfaces';
import { getDecryptedUserKeysHelper } from '@proton/shared/lib/keys';
import { getUserKey } from '@proton/shared/test/keys/keyDataHelper';

import { generateAddress, releaseCryptoProxy, setupCryptoProxyForTesting } from '../../../utils/test/crypto';
import { getPossibleAddressPrivateKeys } from './utils';

const DEFAULT_KEYPASSWORD = '1';

jest.setTimeout(20000);

describe('useLockedVolume -- utils', () => {
    beforeAll(async () => {
        await setupCryptoProxyForTesting();
    });

    afterAll(async () => {
        await releaseCryptoProxy();
    });

    describe('getPossibleAddressPrivateKeys()', () => {
        it('return empty array if no matching keys found', async () => {
            const keyPassword = DEFAULT_KEYPASSWORD;
            const userKeysFull = await Promise.all([getUserKey('a', keyPassword, 2), getUserKey('b', keyPassword, 2)]);

            const UserKeys = userKeysFull.map(({ Key }) => Key);
            const decryptedUserKeys: DecryptedAddressKey[] = [];

            const addressesKeys = [
                {
                    address: await generateAddress(UserKeys, 'email@pm.me'),
                    keys: decryptedUserKeys,
                },
            ];

            expect(getPossibleAddressPrivateKeys(addressesKeys).length).toBe(0);
        });
        it('return only matching decrypted keys', async () => {
            const keyPassword = DEFAULT_KEYPASSWORD;
            const user1KeysFull = await Promise.all([getUserKey('a', keyPassword, 2), getUserKey('b', keyPassword, 2)]);
            const user2KeysFull = await Promise.all([getUserKey('c', keyPassword, 2), getUserKey('d', keyPassword, 2)]);

            const User1Keys = user1KeysFull.map(({ Key }) => Key);
            const User2Keys = user2KeysFull.map(({ Key }) => Key);
            const User1 = {
                Keys: User1Keys.slice(0, 1),
            } as unknown as User;
            const User2 = {
                Keys: User2Keys.slice(0, 1),
            } as unknown as User;

            const getAddressKey = (key: DecryptedKey): DecryptedAddressKey => ({ ...key, Flags: 0, Primary: 0 });
            const decryptedUserKeysUser1 = (await getDecryptedUserKeysHelper(User1, keyPassword)).map(getAddressKey);
            const decryptedUserKeysUser2 = (await getDecryptedUserKeysHelper(User2, keyPassword)).map(getAddressKey);

            const addressesKeysUser1 = [
                {
                    address: await generateAddress(User1Keys, 'email@pm.me'),
                    keys: decryptedUserKeysUser1,
                },
            ];

            const addressesKeysUser2 = [
                {
                    address: await generateAddress(User2Keys, 'email@pm.me'),
                    keys: decryptedUserKeysUser2,
                },
            ];

            expect(getPossibleAddressPrivateKeys(addressesKeysUser1)).toMatchObject(
                decryptedUserKeysUser1.map((decryptedKey) => decryptedKey.privateKey)
            );

            expect(getPossibleAddressPrivateKeys(addressesKeysUser2)).toMatchObject(
                decryptedUserKeysUser2.map((decryptedKey) => decryptedKey.privateKey)
            );
        });
    });
});
