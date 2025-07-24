import { generateUserKey } from '../../lib/keys';

describe('user keys', () => {
    it('should throw if generated key cannot decrypt', async () => {
        await expectAsync(
            generateUserKey({
                passphrase: '123',
                keyGenConfig: {
                    // @ts-expect-error option not declared, only needed for this test
                    subkeys: [],
                },
            })
        ).toBeRejectedWithError(/Unexpected key generation issue/);
    });
});
