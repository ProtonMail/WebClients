import { decryptPrivateKey } from 'pmcrypto';

import { DecryptableKey, OrganizationPrivateKey, NotDecryptableKey, SubKey } from './keys.data';
import { prepareKeys, prepareMemberKeys } from '../../lib/keys/keys';

describe('keys', () => {
    it('should prepare keys', async () => {
        const preparedKeys = await prepareKeys([DecryptableKey, NotDecryptableKey], '123');

        expect(preparedKeys).toEqual([
            {
                Key: DecryptableKey,
                privateKey: jasmine.any(Object)
            },
            {
                Key: NotDecryptableKey,
                privateKey: jasmine.any(Object)
            }
        ]);

        expect(preparedKeys[0].privateKey.isDecrypted()).toBeTruthy();
        expect(preparedKeys[1].privateKey.isDecrypted()).toBeFalsy();
    });

    it('should prepare the keys if a subuser', async () => {
        const orgKey = await decryptPrivateKey(OrganizationPrivateKey, '123');
        const preparedKeys = await prepareMemberKeys([SubKey], orgKey);

        expect(preparedKeys).toEqual([
            {
                Key: SubKey,
                privateKey: jasmine.any(Object)
            }
        ]);

        expect(preparedKeys[0].privateKey.isDecrypted()).toBeTruthy();
    });
});
