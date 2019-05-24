import { DecryptableKey, OrganizationPrivateKey, NotDecryptableKey, SubKey } from './keys.data';
import { prepareKeys } from '../../lib/keys/keys';

describe('keys', () => {
    it('should prepare keys', async () => {
        const preparedKeys = await prepareKeys({
            Keys: [DecryptableKey, NotDecryptableKey],
            keyPassword: '123'
        });

        expect(preparedKeys)
            .toEqual([
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
        const preparedKeys = await prepareKeys({
            Keys: [SubKey],
            keyPassword: '123',
            OrganizationPrivateKey
        });

        expect(preparedKeys)
            .toEqual([{
                Key: SubKey,
                privateKey: jasmine.any(Object)
            }]);

        expect(preparedKeys[0].privateKey.isDecrypted()).toBeTruthy();
    });
});
