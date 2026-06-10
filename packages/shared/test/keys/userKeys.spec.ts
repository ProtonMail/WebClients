import { generateUserKey } from '../../lib/keys';

describe('user keys', () => {
    it('should throw if generated key cannot decrypt', async () => {
        await expect(
            generateUserKey({
                passphrase: '123',
                keyGenConfig: {
                    // @ts-expect-error option not declared, only needed for this test
                    subkeys: [],
                },
            })
        ).rejects.toThrow(/Unexpected key generation issue/);
    });
});
